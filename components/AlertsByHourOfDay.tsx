"use client";

import { useTooltipHideOnBlur } from "@/lib/useTooltipHideOnBlur";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getAlertsByCity, getLocalDateString } from "@/lib/dateUtils";
import { getColorForIndex } from "@/lib/chartColors";
import type { Alert } from "@/lib/types";

interface HourDataPoint {
  hour: string;
  avgCount?: number;
  [key: string]: string | number | undefined;
}

function aggregateByHourAverage(alerts: Alert[]): HourDataPoint[] {
  const byHour: Record<number, number> = {};
  const datesSeen = new Set<string>();

  for (let h = 0; h < 24; h++) byHour[h] = 0;

  for (const a of alerts) {
    if (!a.alertDate) continue;
    const d = new Date(a.alertDate);
    const hour = d.getHours();
    datesSeen.add(getLocalDateString(a.alertDate));
    byHour[hour]++;
  }

  const numDays = datesSeen.size || 1;
  return Array.from({ length: 24 }, (_, h) => ({
    hour: `${h.toString().padStart(2, "0")}:00`,
    avgCount: Math.round((byHour[h] / numDays) * 100) / 100,
  }));
}

function aggregateByHourAveragePerCity(
  alertsByCity: Record<string, Alert[]>,
  cities: string[]
): HourDataPoint[] {
  const result: HourDataPoint[] = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h.toString().padStart(2, "0")}:00`,
  }));

  for (const city of cities) {
    const cityAlerts = alertsByCity[city] ?? [];
    const byHour: Record<number, number> = {};
    const datesSeen = new Set<string>();

    for (let h = 0; h < 24; h++) byHour[h] = 0;

    for (const a of cityAlerts) {
      if (!a.alertDate) continue;
      const d = new Date(a.alertDate);
      const hour = d.getHours();
      datesSeen.add(getLocalDateString(a.alertDate));
      byHour[hour]++;
    }

    const numDays = datesSeen.size || 1;
    for (let h = 0; h < 24; h++) {
      result[h][city] = Math.round((byHour[h] / numDays) * 100) / 100;
    }
  }

  return result;
}

export function AlertsByHourOfDay({
  alerts,
  selectedCities,
}: {
  alerts: Alert[];
  selectedCities: string[];
}) {
  const multiCity = selectedCities.length > 1;
  const data = multiCity
    ? aggregateByHourAveragePerCity(getAlertsByCity(alerts, selectedCities), selectedCities)
    : aggregateByHourAverage(alerts);

  if (alerts.length === 0) return null;

  const { ref: chartRef, handleMouseEnter, handleBlur, activeOverride } = useTooltipHideOnBlur();
  const tooltipStyle = {
    backgroundColor: "var(--background)",
    border: "1px solid var(--foreground)",
    borderRadius: "8px",
  };

  return (
    <div
      ref={chartRef}
      onMouseEnter={handleMouseEnter}
      onBlur={handleBlur}
      tabIndex={0}
      className="h-64 w-full outline-none"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 12 }}
            className="text-zinc-600 dark:text-zinc-400"
          />
          <YAxis tick={{ fontSize: 12 }} className="text-zinc-600 dark:text-zinc-400" />
          <Tooltip active={activeOverride} contentStyle={tooltipStyle} />
          {multiCity ? (
            <>
              {selectedCities.map((city, i) => (
                <Bar
                  key={city}
                  dataKey={city}
                  name={city}
                  fill={getColorForIndex(i)}
                  radius={[4, 4, 0, 0]}
                />
              ))}
              <Legend />
            </>
          ) : (
            <Bar
              dataKey="avgCount"
              name="Avg alerts"
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
