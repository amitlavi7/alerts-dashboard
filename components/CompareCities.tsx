"use client";

import { getCategoryDisplayName } from "@/lib/categoryNames";
import {
  getAlertsByCity,
  getDateRange,
  getDaysSinceLastAlert,
  getPeakDay,
} from "@/lib/dateUtils";
import { getColorForIndex } from "@/lib/chartColors";
import type { Alert } from "@/lib/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAlertDateTime(alertDate: string): string {
  const d = new Date(alertDate);
  const date = d.toISOString().slice(0, 10);
  const time = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  return `${date} ${time}`;
}

function getLastAlert(alerts: Alert[]): Alert | null {
  if (alerts.length === 0) return null;
  const sorted = [...alerts].sort(
    (a, b) => new Date(b.alertDate).getTime() - new Date(a.alertDate).getTime()
  );
  return sorted[0];
}

export function CompareCities({
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
  if (selectedCities.length < 2) return null;

  const alertsByCity = getAlertsByCity(alerts, selectedCities);
  const daysInRange = getDateRange(startDate, endDate).length;

  const cityData = selectedCities.map((city, i) => {
    const cityAlerts = alertsByCity[city] ?? [];
    const total = cityAlerts.length;
    const avgPerDay =
      daysInRange > 0 ? (total / daysInRange).toFixed(1) : "0";
    const peakDay = getPeakDay(cityAlerts);
    const daysSinceLast = getDaysSinceLastAlert(cityAlerts, endDate);
    const last = getLastAlert(cityAlerts);
    const color = getColorForIndex(i);

    return {
      city,
      total,
      avgPerDay,
      peakDay,
      daysSinceLast,
      last,
      color,
    };
  });

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
        Compare locations
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cityData.map(({ city, total, avgPerDay, peakDay, daysSinceLast, last, color }) => (
          <div
            key={city}
            className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/50"
          >
            <h3
              className="mb-3 border-b-2 pb-2 font-semibold"
              style={{ borderBottomColor: color }}
            >
              {city}
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-600 dark:text-zinc-400">Total</dt>
                <dd className="font-medium tabular-nums">{total}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600 dark:text-zinc-400">Per day</dt>
                <dd className="font-medium tabular-nums">{avgPerDay}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600 dark:text-zinc-400">Peak day</dt>
                <dd className="font-medium">
                  {peakDay
                    ? `${formatDate(peakDay.date)} (${peakDay.count})`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600 dark:text-zinc-400">Days since last</dt>
                <dd className="font-medium">
                  {daysSinceLast !== null ? daysSinceLast : "—"}
                </dd>
              </div>
              {last && (
                <div className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                  <dt className="mb-1 text-zinc-600 dark:text-zinc-400">
                    Last alert
                  </dt>
                  <dd className="font-medium">{last.data || "—"}</dd>
                  <dd className="text-xs text-zinc-500 dark:text-zinc-400">
                    {getCategoryDisplayName(last.category, last.category_desc)} ·{" "}
                    {formatAlertDateTime(last.alertDate)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
