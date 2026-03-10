"use client";

import { getAlertsByCity } from "@/lib/dateUtils";
import { getCategoryDisplayName } from "@/lib/categoryNames";
import type { Alert } from "@/lib/types";

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

function AlertRow({ alert }: { alert: Alert }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <span className="font-medium text-zinc-800 dark:text-zinc-200">
          {alert.data || "—"}
        </span>
        <span className="ml-2 text-zinc-600 dark:text-zinc-400">
          {getCategoryDisplayName(alert.category, alert.category_desc)}
        </span>
      </div>
      <span className="text-sm text-zinc-500 dark:text-zinc-500">
        {formatAlertDateTime(alert.alertDate)}
      </span>
    </div>
  );
}

export function LastAlert({
  alerts,
  selectedCities,
}: {
  alerts: Alert[];
  selectedCities: string[];
}) {
  if (selectedCities.length > 1 || alerts.length === 0) return null;

  const multiCity = selectedCities.length > 1;

  if (multiCity) {
    const alertsByCity = getAlertsByCity(alerts, selectedCities);
    const entries = selectedCities
      .map((city) => {
        const cityAlerts = alertsByCity[city] ?? [];
        const last = getLastAlert(cityAlerts);
        return { city, last };
      })
      .filter((e) => e.last !== null) as { city: string; last: Alert }[];

    if (entries.length === 0) return null;

    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
          Most recent alert
        </h2>
        <div className="space-y-3">
          {entries.map(({ city, last }) => (
            <div
              key={city}
              className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/50"
            >
              <h3 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {city}
              </h3>
              <AlertRow alert={last} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const last = getLastAlert(alerts);
  if (!last) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
        Most recent alert
      </h2>
      <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/50">
        <AlertRow alert={last} />
      </div>
    </section>
  );
}
