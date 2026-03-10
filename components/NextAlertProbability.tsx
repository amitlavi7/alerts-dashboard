"use client";

import { useEffect, useState } from "react";
import {
  getLocationProbabilities,
  getNextAlertTime,
} from "@/lib/alertProbability";
import { getAlertsByCity } from "@/lib/dateUtils";
import type { Alert } from "@/lib/types";

const ALERTS_PREVIEW_LIMIT = 15;

function formatNow(d: Date): string {
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatAlertDate(alertDate: string): { date: string; time: string } {
  const d = new Date(alertDate);
  return {
    date: d.toISOString().slice(0, 10),
    time: `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`,
  };
}

export function NextAlertProbability({
  alerts,
  selectedCities,
}: {
  alerts: Alert[];
  selectedCities: string[];
}) {
  const [now, setNow] = useState(() => new Date());
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const [expandedCities, setExpandedCities] = useState<Record<string, boolean>>({});
  const [showAllByCity, setShowAllByCity] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (alerts.length === 0) return null;

  const hasLocationFilter = selectedCities.length > 0;
  const multiCity = selectedCities.length > 1;
  const alertsByCity = multiCity ? getAlertsByCity(alerts, selectedCities) : null;

  const prediction = getNextAlertTime(alerts, now);
  const sortedAlerts = [...alerts].sort(
    (a, b) => new Date(b.alertDate).getTime() - new Date(a.alertDate).getTime()
  );
  const displayedAlerts = showAllAlerts
    ? sortedAlerts
    : sortedAlerts.slice(0, ALERTS_PREVIEW_LIMIT);
  const hasMore = sortedAlerts.length > ALERTS_PREVIEW_LIMIT;

  const alertsList = (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setAlertsExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-400"
      >
        Based on these {alerts.length} alerts
        <span className="shrink-0 pl-2" aria-hidden>
          {alertsExpanded ? "▼" : "▶"}
        </span>
      </button>
      {alertsExpanded && (
        <div className="mt-2 space-y-2">
          <ul className="max-h-48 overflow-y-auto rounded border border-zinc-200 dark:border-zinc-700">
            {displayedAlerts.map((a, i) => {
              const { date, time } = formatAlertDate(a.alertDate);
              return (
                <li
                  key={a.rid ?? `${a.alertDate}-${a.data}-${i}`}
                  className="flex items-center justify-between gap-2 border-b border-zinc-100 px-2 py-1.5 text-xs last:border-b-0 dark:border-zinc-700"
                >
                  <span className="truncate" title={a.data}>
                    {a.data || "—"}
                  </span>
                  <span className="flex shrink-0 gap-2 text-zinc-500 dark:text-zinc-500">
                    <span>{date}</span>
                    <span>{time}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          {hasMore && !showAllAlerts && (
            <button
              type="button"
              onClick={() => setShowAllAlerts(true)}
              className="text-xs text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-400"
            >
              Show all {sortedAlerts.length} alerts
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (hasLocationFilter && multiCity) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Now {formatNow(now)}. The prediction uses the hour with the most alerts after the current time.
        </p>
        {selectedCities.map((city) => {
          const cityAlerts = (alertsByCity?.[city] ?? []) as Alert[];
          const cityPrediction = getNextAlertTime(cityAlerts, now);
          const citySorted = [...cityAlerts].sort(
            (a, b) => new Date(b.alertDate).getTime() - new Date(a.alertDate).getTime()
          );
          const cityShowAll = showAllByCity[city];
          const cityDisplayed = cityShowAll ? citySorted : citySorted.slice(0, ALERTS_PREVIEW_LIMIT);
          const cityHasMore = citySorted.length > ALERTS_PREVIEW_LIMIT;
          return (
            <div
              key={city}
              className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
            >
              <p className="font-medium text-zinc-800 dark:text-zinc-200">
                {city}:{" "}
                {cityPrediction ? (
                  <strong>
                    {cityPrediction.isTomorrow ? "tomorrow " : ""}
                    {cityPrediction.time}
                  </strong>
                ) : (
                  "—"
                )}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Based on {cityAlerts.length} historical alerts
              </p>
              {cityAlerts.length > 0 && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCities((prev) => ({
                        ...prev,
                        [city]: !prev[city],
                      }))
                    }
                    className="flex w-full items-center justify-between text-left text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-400"
                  >
                    Based on these {cityAlerts.length} alerts
                    <span className="shrink-0 pl-2" aria-hidden>
                      {expandedCities[city] ? "▼" : "▶"}
                    </span>
                  </button>
                  {expandedCities[city] && (
                    <div className="mt-2 space-y-2">
                      <ul className="max-h-48 overflow-y-auto rounded border border-zinc-200 dark:border-zinc-700">
                        {cityDisplayed.map((a, i) => {
                          const { date, time } = formatAlertDate(a.alertDate);
                          return (
                            <li
                              key={a.rid ?? `${a.alertDate}-${a.data}-${i}`}
                              className="flex items-center justify-between gap-2 border-b border-zinc-100 px-2 py-1.5 text-xs last:border-b-0 dark:border-zinc-700"
                            >
                              <span className="truncate" title={a.data}>
                                {a.data || "—"}
                              </span>
                              <span className="flex shrink-0 gap-2 text-zinc-500 dark:text-zinc-500">
                                <span>{date}</span>
                                <span>{time}</span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      {cityHasMore && !cityShowAll && (
                        <button
                          type="button"
                          onClick={() =>
                            setShowAllByCity((prev) => ({ ...prev, [city]: true }))
                          }
                          className="text-xs text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-400"
                        >
                          Show all {citySorted.length} alerts
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (hasLocationFilter) {
    const location = selectedCities[0];
    return (
      <div className="space-y-3 text-sm">
        <p className="font-medium text-zinc-800 dark:text-zinc-200">
          Now {formatNow(now)} — Next alert in {location}:{" "}
          {prediction ? (
            <strong>
              {prediction.isTomorrow ? "tomorrow " : ""}
              {prediction.time}
            </strong>
          ) : (
            "—"
          )}
        </p>
        <p className="text-zinc-600 dark:text-zinc-400">
          Based on {alerts.length} historical alerts
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          The prediction uses the hour with the most alerts after the current time. If it’s late in the day, it may show tomorrow’s most likely hour.
        </p>
        {alertsList}
      </div>
    );
  }

  const topLocations = getLocationProbabilities(alerts).slice(0, 3);
  const top = topLocations[0];

  return (
    <div className="space-y-3 text-sm">
      <p className="font-medium text-zinc-800 dark:text-zinc-200">
        Now {formatNow(now)} — Next alert:{" "}
        {prediction ? (
          <strong>
            {prediction.isTomorrow ? "tomorrow " : ""}
            {prediction.time}
          </strong>
        ) : (
          "—"
        )}
        {top && (
          <>
            {" "}
            (most likely in <strong>{top.location}</strong>)
          </>
        )}
      </p>
      <p className="text-zinc-600 dark:text-zinc-400">
        Based on {alerts.length} historical alerts
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        The prediction uses the hour with the most alerts after the current time. Location is based on historical frequency. If it’s late in the day, the time may show tomorrow’s most likely hour.
      </p>
      {alertsList}
    </div>
  );
}
