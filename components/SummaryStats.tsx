"use client";

import {
  getDateRange,
  getDaysSinceLastAlert,
  getPeakDay,
  getAttackOriginStats,
  getAlertTimingStats,
  formatDuration,
} from "@/lib/dateUtils";
import type { Alert } from "@/lib/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SummaryStats({
  alerts,
  alertsForOrigin,
  startDate,
  endDate,
}: {
  alerts: Alert[];
  alertsForOrigin?: Alert[];
  startDate: string;
  endDate: string;
}) {
  const total = alerts.length;
  const daysInRange = getDateRange(startDate, endDate).length;
  const avgPerDay = daysInRange > 0 ? (total / daysInRange).toFixed(1) : "0";
  const peakDay = getPeakDay(alerts);
  const daysSinceLast = getDaysSinceLastAlert(alerts, endDate);
  const origin = getAttackOriginStats(alertsForOrigin ?? alerts);
  const timing = getAlertTimingStats(alertsForOrigin ?? alerts);

  const statCard =
    "rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-zinc-700/80 dark:bg-zinc-900/50";

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
        Overview
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <div className={statCard}>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total alerts
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
            {total}
          </p>
        </div>
        <div className={statCard}>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Per day avg
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
            {avgPerDay}
          </p>
        </div>
        <div className={statCard}>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Peak day
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
            {peakDay ? (
              <>
                {formatDate(peakDay.date)}
                <span className="ml-1 text-base font-normal text-zinc-500 dark:text-zinc-400">
                  ({peakDay.count})
                </span>
              </>
            ) : (
              "—"
            )}
          </p>
        </div>
        <div className={statCard}>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Days since last
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
            {daysSinceLast !== null ? daysSinceLast : "—"}
          </p>
        </div>
        {(origin.iran > 0 || origin.lebanon > 0) && (
          <>
            <div className={`${statCard} border-amber-200/50 dark:border-amber-900/30`}>
              <p className="text-xs font-medium uppercase tracking-wider text-amber-700/90 dark:text-amber-400/90">
                Iran attacks
              </p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                {origin.iran}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Preceded by imminent warning
              </p>
            </div>
            <div className={`${statCard} border-orange-200/50 dark:border-orange-900/30`}>
              <p className="text-xs font-medium uppercase tracking-wider text-orange-700/90 dark:text-orange-400/90">
                Lebanon attacks
              </p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                {origin.lebanon}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                No prior warning
              </p>
            </div>
          </>
        )}
        {(timing.avgMs14to1 !== null || timing.avgMs1to13 !== null) && (
          <>
            {timing.avgMs14to1 !== null && (
              <div className={statCard}>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Warning lead time
                </p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {formatDuration(timing.avgMs14to1)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Imminent → impact ({timing.count14to1} events)
                </p>
              </div>
            )}
            {timing.avgMs1to13 !== null && (
              <div className={statCard}>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  All-clear time
                </p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {formatDuration(timing.avgMs1to13)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Impact → release ({timing.count1to13} events)
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
