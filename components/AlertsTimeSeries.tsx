"use client";

import { useState } from "react";
import { useTooltipHideOnBlur } from "@/lib/useTooltipHideOnBlur";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getAlertsByCity, getDateRange, getLocalDateString } from "@/lib/dateUtils";
import { getColorForIndex } from "@/lib/chartColors";
import { getCategoryDisplayName } from "@/lib/categoryNames";
import type { Alert } from "@/lib/types";

interface TimeSeriesDataPoint {
  date: string;
  count?: number;
  [key: string]: string | number | undefined;
}

function formatTime(alertDate: string): string {
  const d = new Date(alertDate);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const TEN_MIN_MS = 10 * 60 * 1000;

/** Group alerts within 10 min, count as 1 event. */
function countEvents(alerts: Alert[]): number {
  if (alerts.length === 0) return 0;
  const sorted = [...alerts].sort(
    (a, b) => new Date(a.alertDate).getTime() - new Date(b.alertDate).getTime()
  );
  let events = 1;
  let lastTime = new Date(sorted[0].alertDate).getTime();
  for (let i = 1; i < sorted.length; i++) {
    const t = new Date(sorted[i].alertDate).getTime();
    if (t - lastTime > TEN_MIN_MS) {
      events++;
      lastTime = t;
    }
  }
  return events;
}

function aggregateByDay(
  alerts: Alert[],
  startDate: string,
  endDate: string
): TimeSeriesDataPoint[] {
  const byDay: Record<string, Alert[]> = {};
  for (const a of alerts) {
    const date = a.alertDate ? getLocalDateString(a.alertDate) : "unknown";
    if (date !== "unknown") {
      if (!byDay[date]) byDay[date] = [];
      byDay[date].push(a);
    }
  }
  return getDateRange(startDate, endDate).map((date) => ({
    date,
    count: countEvents(byDay[date] ?? []),
  }));
}

function aggregateByDayAndCity(
  alertsByCity: Record<string, Alert[]>,
  cities: string[],
  startDate: string,
  endDate: string
): TimeSeriesDataPoint[] {
  const byDay: Record<string, Record<string, Alert[]>> = {};
  for (const city of cities) {
    const cityAlerts = alertsByCity[city] ?? [];
    for (const a of cityAlerts) {
      const date = a.alertDate ? getLocalDateString(a.alertDate) : "unknown";
      if (date === "unknown") continue;
      if (!byDay[date]) byDay[date] = {};
      if (!byDay[date][city]) byDay[date][city] = [];
      byDay[date][city].push(a);
    }
  }
  return getDateRange(startDate, endDate).map((date) => {
    const counts: Record<string, number> = {};
    for (const city of cities) {
      counts[city] = countEvents(byDay[date]?.[city] ?? []);
    }
    return { date, ...counts };
  });
}

export function AlertsTimeSeries({
  alerts,
  selectedCities,
  startDate,
  endDate,
}: {
  alerts: Alert[];
  selectedCities: string[];
  startDate: string;
  endDate: string;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const multiCity = selectedCities.length > 1;

  const alertsByDate: Record<string, Alert[]> = {};
  for (const a of alerts) {
    const date = a.alertDate ? getLocalDateString(a.alertDate) : null;
    if (!date) continue;
    if (!alertsByDate[date]) alertsByDate[date] = [];
    alertsByDate[date].push(a);
  }
  for (const date of Object.keys(alertsByDate)) {
    alertsByDate[date].sort(
      (a, b) => new Date(a.alertDate).getTime() - new Date(b.alertDate).getTime()
    );
  }

  const data =
    startDate && endDate
      ? multiCity
        ? aggregateByDayAndCity(
            getAlertsByCity(alerts, selectedCities),
            selectedCities,
            startDate,
            endDate
          )
        : aggregateByDay(alerts, startDate, endDate)
      : [];

  if (data.length === 0) return null;

  const { ref: chartRef, handleMouseEnter, handleBlur, activeOverride } = useTooltipHideOnBlur();
  const tooltipStyle = {
    backgroundColor: "var(--background)",
    border: "1px solid var(--foreground)",
    borderRadius: "8px",
    zIndex: 1000,
  };

  const selectedAlerts = selectedDate ? alertsByDate[selectedDate] ?? [] : [];
  const alertsByCityForDate =
    selectedDate && multiCity
      ? (() => {
          const byCity = getAlertsByCity(alerts, selectedCities);
          const result: Record<string, Alert[]> = {};
          for (const city of selectedCities) {
            const cityAlerts = (byCity[city] ?? []).filter(
              (a) => getLocalDateString(a.alertDate) === selectedDate
            );
            cityAlerts.sort(
              (a, b) => new Date(a.alertDate).getTime() - new Date(b.alertDate).getTime()
            );
            result[city] = cityAlerts;
          }
          return result;
        })()
      : null;

  return (
    <div className="space-y-4">
      <div
        ref={chartRef}
        onMouseEnter={handleMouseEnter}
        onBlur={handleBlur}
        tabIndex={0}
        className="h-64 w-full outline-none"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              className="text-zinc-600 dark:text-zinc-400"
            />
            <YAxis tick={{ fontSize: 12 }} className="text-zinc-600 dark:text-zinc-400" />
            <Tooltip
              active={activeOverride}
              contentStyle={tooltipStyle}
              wrapperStyle={{ pointerEvents: "auto", zIndex: 1000 }}
              trigger="click"
              cursor={{ stroke: "var(--foreground)", strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]?.payload?.date) return null;
                const p = payload[0].payload as Record<string, unknown>;
                const date = p.date as string;
                const count = (p.count as number) ?? countEvents(alertsByDate[date] ?? []);
                const countsByCity = multiCity
                  ? selectedCities.map((city, i) => (
                      <div key={city} className="flex justify-between gap-4">
                        <span style={{ color: getColorForIndex(i) }}>{city}</span>
                        <span>{String(p[city] ?? 0)}</span>
                      </div>
                    ))
                  : null;
                return (
                  <div
                    className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-600 dark:bg-zinc-800"
                    style={{ pointerEvents: "auto" }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="text-sm font-medium">{formatDateDisplay(date)}</div>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {countsByCity ? (
                        <div className="space-y-0.5">{countsByCity}</div>
                      ) : (
                        `${count} alert${count !== 1 ? "s" : ""}`
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setSelectedDate(date);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="mt-2 block w-full rounded bg-zinc-200 px-2 py-1.5 text-left text-xs font-medium hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                    >
                      View list
                    </button>
                  </div>
                );
              }}
            />
            {multiCity ? (
              <>
                {selectedCities.map((city, i) => (
                  <Area
                    key={city}
                    type="monotone"
                    dataKey={city}
                    name={city}
                    stroke={getColorForIndex(i)}
                    fill={getColorForIndex(i)}
                    fillOpacity={0.5}
                    strokeWidth={2}
                    onClick={(payload: unknown) => {
                      const p = payload as { date?: string };
                      if (p?.date) setSelectedDate(p.date);
                    }}
                  />
                ))}
                <Legend />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--chart-1))"
                fill="hsl(var(--chart-1) / 0.3)"
                strokeWidth={2}
                onClick={(payload: unknown) => {
                  const p = payload as { date?: string };
                  if (p?.date) setSelectedDate(p.date);
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {selectedDate && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {formatDateDisplay(selectedDate)} — {selectedAlerts.length} alerts
            </h3>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Close
            </button>
          </div>
          {alertsByCityForDate ? (
            <div className="max-h-64 space-y-4 overflow-y-auto">
              {selectedCities.map((city, i) => {
                const cityAlerts = alertsByCityForDate[city] ?? [];
                if (cityAlerts.length === 0) return null;
                return (
                  <div key={city}>
                    <h4
                      className="mb-1.5 text-xs font-semibold"
                      style={{ color: getColorForIndex(i) }}
                    >
                      {city} ({cityAlerts.length})
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {cityAlerts.map((a, j) => (
                        <li
                          key={j}
                          className="flex justify-between gap-4 rounded px-2 py-1 text-zinc-700 dark:text-zinc-300"
                        >
                          <span className="truncate">{a.data || "—"}</span>
                          <span className="shrink-0 text-zinc-500 dark:text-zinc-400">
                            {formatTime(a.alertDate)} ·{" "}
                            {getCategoryDisplayName(a.category, a.category_desc)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <ul className="max-h-48 space-y-1.5 overflow-y-auto text-sm">
              {selectedAlerts.map((a, i) => (
                <li
                  key={i}
                  className="flex justify-between gap-4 rounded px-2 py-1 text-zinc-700 dark:text-zinc-300"
                >
                  <span className="truncate">{a.data || "—"}</span>
                  <span className="shrink-0 text-zinc-500 dark:text-zinc-400">
                    {formatTime(a.alertDate)} · {getCategoryDisplayName(a.category, a.category_desc)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
