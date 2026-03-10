"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertsTimeSeries } from "./AlertsTimeSeries";
import { AlertsByHourOfDay } from "./AlertsByHourOfDay";
import { NextAlertProbability } from "./NextAlertProbability";
import { AlertsByCategory } from "./AlertsByCategory";
import { AlertsByLocation } from "./AlertsByLocation";
import { CompareCities } from "./CompareCities";
import { CityFilter } from "./CityFilter";
import { LastAlert } from "./LastAlert";
import { DateRangePicker } from "./DateRangePicker";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { SummaryStats } from "./SummaryStats";
import { isDrill, isNewsFlash } from "@/lib/categoryNames";
import {
  filterAlertsByCities,
  filterAlertsByDateRange,
  getAlertsDateBounds,
  getUniqueLocations,
} from "@/lib/dateUtils";
import type { Alert } from "@/lib/types";

function normalizeAlerts(raw: unknown): Alert[] {
  if (Array.isArray(raw)) return raw as Alert[];
  if (raw && typeof raw === "object" && "data" in raw && Array.isArray((raw as { data: unknown }).data)) {
    return (raw as { data: Alert[] }).data;
  }
  return [];
}

export function Dashboard() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [excludeDrills, setExcludeDrills] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const hasInitializedDates = useRef(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    if (!isRefresh) hasInitializedDates.current = false;
    try {
      const url = isRefresh ? `/api/alerts?days=90&_=${Date.now()}` : "/api/alerts?days=90";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const raw = await res.json();
      setAlerts(normalizeAlerts(raw));
      setLastUpdatedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load alerts");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => load(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (alerts && alerts.length > 0 && !hasInitializedDates.current) {
      const bounds = getAlertsDateBounds(alerts);
      if (bounds) {
        hasInitializedDates.current = true;
        const today = new Date().toISOString().slice(0, 10);
        const year = new Date().getFullYear();
        const feb28 = `${year}-02-28`;
        const start = feb28 <= today ? feb28 : `${year - 1}-02-28`;
        const end = today > bounds.max ? bounds.max : today;
        setStartDate(start);
        setEndDate(end);
      }
    }
  }, [alerts]);

  const bounds = alerts ? getAlertsDateBounds(alerts) : null;
  const effectiveBounds = bounds ?? { min: "", max: "" };
  const displayStart = startDate || effectiveBounds.min;
  const displayEnd = endDate || effectiveBounds.max;
  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    const byDate = filterAlertsByDateRange(alerts, displayStart || null, displayEnd || null);
    const noNewsFlash = byDate.filter((a) => !isNewsFlash(a.category));
    const noDrillsIfExcluded = excludeDrills
      ? noNewsFlash.filter((a) => !isDrill(a.category))
      : noNewsFlash;
    return filterAlertsByCities(noDrillsIfExcluded, selectedCities);
  }, [alerts, displayStart, displayEnd, selectedCities, excludeDrills]);

  const alertsForOrigin = useMemo(() => {
    if (!alerts) return [];
    const byDate = filterAlertsByDateRange(alerts, displayStart || null, displayEnd || null);
    return filterAlertsByCities(byDate, selectedCities);
  }, [alerts, displayStart, displayEnd, selectedCities]);

  const cityOptions = useMemo(
    () => getUniqueLocations(alerts ?? []),
    [alerts]
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/80 p-6 dark:border-red-900/50 dark:bg-red-950/50">
        <p className="font-semibold text-red-800 dark:text-red-200">Couldn&apos;t load alerts</p>
        <p className="mt-1 text-sm text-red-700/90 dark:text-red-300/90">{error}</p>
        <button
          type="button"
          onClick={() => load()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-zinc-500 dark:text-zinc-400">No alerts in this period</p>
      </div>
    );
  }

  const sectionCard =
    "rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/50";

  return (
    <div className="space-y-8">
      <section className={sectionCard}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
              Filters
            </h2>
            {lastUpdatedAt && (
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Data updated to {lastUpdatedAt.toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={isRefreshing}
            className="rounded-lg border border-zinc-300 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            {isRefreshing ? "Refreshing…" : "Refresh data"}
          </button>
        </div>
        <div className="space-y-5">
          <div>
            <h3 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Date range
            </h3>
            <DateRangePicker
              startDate={displayStart}
              endDate={displayEnd}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              min={effectiveBounds.min || undefined}
              max={effectiveBounds.max || undefined}
            />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Alert types
            </h3>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={excludeDrills}
                onChange={(e) => setExcludeDrills(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800"
              />
              <span className="text-sm">Exclude drills</span>
            </label>
          </div>
          <CityFilter
            options={cityOptions}
            selected={selectedCities}
            onChange={setSelectedCities}
          />
        </div>
      </section>
      <SummaryStats
        alerts={filteredAlerts}
        alertsForOrigin={alertsForOrigin}
        startDate={displayStart}
        endDate={displayEnd}
      />
      <LastAlert alerts={filteredAlerts} selectedCities={selectedCities} />
      <CompareCities
        alerts={filteredAlerts}
        selectedCities={selectedCities}
        startDate={displayStart}
        endDate={displayEnd}
      />
      {/* <section>
        <h2 className="mb-4 text-lg font-semibold">Next alert probability</h2>
        <div key={`${displayStart}-${displayEnd}`} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <NextAlertProbability alerts={filteredAlerts} selectedCities={selectedCities} />
        </div>
      </section> */}
      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
          Alerts over time
        </h2>
        <div className={sectionCard}>
          <AlertsTimeSeries
            key={`ts-${displayStart}-${displayEnd}`}
            alerts={filteredAlerts}
            selectedCities={selectedCities}
            startDate={displayStart}
            endDate={displayEnd}
          />
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
          Hourly pattern
        </h2>
        <div key={`hour-${displayStart}-${displayEnd}`} className={sectionCard}>
          <AlertsByHourOfDay alerts={filteredAlerts} selectedCities={selectedCities} />
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
          By alert type
        </h2>
        <div key={`cat-${displayStart}-${displayEnd}`} className={sectionCard}>
          <AlertsByCategory alerts={filteredAlerts} selectedCities={selectedCities} />
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
          Top locations
        </h2>
        <div key={`loc-${displayStart}-${displayEnd}`} className={sectionCard}>
          <AlertsByLocation alerts={filteredAlerts} selectedCities={selectedCities} />
        </div>
      </section>
    </div>
  );
}
