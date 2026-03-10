import type { Alert } from "./types";
import { getLocationMatchStrings } from "./locationAliases";

/** Get YYYY-MM-DD in local timezone (for chart bucketing, not UTC). */
export function getLocalDateString(dateOrIso: string): string {
  const d = new Date(dateOrIso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toStartOfDayLocal(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getTime();
}

function toEndOfDayLocal(dateStr: string): number {
  return new Date(dateStr + "T23:59:59.999").getTime();
}

export function filterAlertsByDateRange(
  alerts: Alert[],
  startDate: string | null,
  endDate: string | null
): Alert[] {
  if (!startDate && !endDate) return alerts;
  return alerts.filter((a) => {
    const d = a.alertDate ? new Date(a.alertDate).getTime() : NaN;
    if (Number.isNaN(d)) return false;
    if (startDate && d < toStartOfDayLocal(startDate)) return false;
    if (endDate && d > toEndOfDayLocal(endDate)) return false;
    return true;
  });
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Return all date strings (YYYY-MM-DD) from start to end inclusive. */
export function getDateRange(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate || startDate > endDate) return [];
  const result: string[] = [];
  let current = startDate;
  while (current <= endDate) {
    result.push(current);
    current = addDays(current, 1);
  }
  return result;
}

/** Check if alert's location data matches a city (exact match, with aliases for zone codes). */
function alertMatchesCity(data: string, city: string): boolean {
  const matchStrings = getLocationMatchStrings(city);
  if (matchStrings.length === 0) return false;
  const parts = (data ?? "")
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  return parts.some((p) => matchStrings.includes(p));
}

export function filterAlertsByCities(
  alerts: Alert[],
  cityNames: string[]
): Alert[] {
  const trimmed = cityNames.map((c) => c.trim().toLowerCase()).filter(Boolean);
  if (trimmed.length === 0) return alerts;
  return alerts.filter((a) =>
    trimmed.some((city) => alertMatchesCity(a.data ?? "", city))
  );
}

/** Group alerts by city - each alert can appear in multiple city groups if it matches multiple. */
export function getAlertsByCity(
  alerts: Alert[],
  cityNames: string[]
): Record<string, Alert[]> {
  const result: Record<string, Alert[]> = {};
  for (const city of cityNames) {
    result[city] = alerts.filter((a) => alertMatchesCity(a.data ?? "", city));
  }
  return result;
}

export function getUniqueLocations(alerts: Alert[]): string[] {
  const seen = new Set<string>();
  for (const a of alerts) {
    const parts = (a.data ?? "").split(",").map((p) => p.trim()).filter(Boolean);
    for (const p of parts) seen.add(p);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b, "he"));
}

export function getAlertsDateBounds(alerts: Alert[]): { min: string; max: string } | null {
  const dates = alerts
    .map((a) => (a.alertDate ? getLocalDateString(a.alertDate) : null))
    .filter((d): d is string => d != null);
  if (dates.length === 0) return null;
  return { min: dates.sort()[0], max: dates.sort().reverse()[0] };
}

/** Days from last alert date to endDate (inclusive). Returns null if no alerts. */
export function getDaysSinceLastAlert(alerts: Alert[], endDate: string): number | null {
  if (alerts.length === 0) return null;
  const sorted = [...alerts].sort(
    (a, b) => new Date(b.alertDate).getTime() - new Date(a.alertDate).getTime()
  );
  const lastDate = getLocalDateString(sorted[0].alertDate);
  const end = new Date(endDate + "T12:00:00").getTime();
  const last = new Date(lastDate + "T12:00:00").getTime();
  const days = Math.round((end - last) / (24 * 60 * 60 * 1000));
  return Math.max(0, days);
}

const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const EVENT_WINDOW_MS = 5 * 60 * 1000; // alerts within 5 min = same attack event

function getLocations(data: string): Set<string> {
  return new Set(
    (data ?? "")
      .split(",")
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Category 14 (imminent) alerts with no category 1 (real alarm) within 15 min after in same area.
 * These are "false alarms" - imminent warnings that were not followed by an actual missile alert.
 */
export function getFalseAlarmAlerts(alerts: Alert[]): Alert[] {
  const cat14 = alerts.filter((a) => String(a.category) === "14");
  const cat1 = alerts.filter((a) => String(a.category) === "1");
  if (cat14.length === 0) return [];

  const cat1ByLoc = indexByLocation(cat1, (a) => new Date(a.alertDate).getTime());

  return cat14.filter((a14) => {
    const t14 = new Date(a14.alertDate).getTime();
    const locs14 = getLocations(a14.data ?? "");
    for (const loc of locs14) {
      const list = cat1ByLoc.get(loc) ?? [];
      for (const { time } of list) {
        if (time >= t14 && time - t14 <= FIFTEEN_MIN_MS) return false;
      }
    }
    return true;
  });
}

/** Index alerts by location for fast lookup. */
function indexByLocation(
  alerts: { alertDate: string; data?: string }[],
  getTime: (a: { alertDate: string }) => number
): Map<string, { time: number }[]> {
  const byLoc = new Map<string, { time: number }[]>();
  for (const a of alerts) {
    const time = getTime(a);
    const locs = getLocations(a.data ?? "");
    for (const loc of locs) {
      const list = byLoc.get(loc) ?? [];
      list.push({ time });
      byLoc.set(loc, list);
    }
  }
  return byLoc;
}

/**
 * Classify missile attacks (category 1) as Iran vs Lebanon:
 * - Iran: had a category 14 (imminent alerts) within 15 min before the missile alert, same area
 * - Lebanon: no preceding category 14
 */
export function getAttackOriginStats(alerts: Alert[]): {
  iran: number;
  lebanon: number;
} {
  const missileAlerts = alerts.filter((a) => String(a.category) === "1");
  const cat14Alerts = alerts.filter((a) => String(a.category) === "14");
  if (missileAlerts.length === 0) return { iran: 0, lebanon: 0 };

  const sorted = [...missileAlerts].sort(
    (a, b) => new Date(a.alertDate).getTime() - new Date(b.alertDate).getTime()
  );

  const events: { time: number; locations: Set<string> }[] = [];
  for (const a of sorted) {
    const t = new Date(a.alertDate).getTime();
    const locs = getLocations(a.data ?? "");
    const last = events[events.length - 1];
    if (last && t - last.time <= EVENT_WINDOW_MS) {
      for (const loc of locs) last.locations.add(loc);
    } else {
      events.push({ time: t, locations: new Set(locs) });
    }
  }

  const byLoc14 = indexByLocation(cat14Alerts, (a) => new Date(a.alertDate).getTime());
  let iran = 0;
  let lebanon = 0;
  for (const ev of events) {
    let hasPreceding14 = false;
    for (const loc of ev.locations) {
      const list = byLoc14.get(loc) ?? [];
      for (const { time } of list) {
        if (time < ev.time && ev.time - time <= FIFTEEN_MIN_MS) {
          hasPreceding14 = true;
          break;
        }
      }
      if (hasPreceding14) break;
    }
    if (hasPreceding14) iran++;
    else lebanon++;
  }
  return { iran, lebanon };
}

/**
 * Average time from pre-alert (14) to alert (1), and from alert (1) to release (13).
 */
export function getAlertTimingStats(alerts: Alert[]): {
  avgMs14to1: number | null;
  avgMs1to13: number | null;
  count14to1: number;
  count1to13: number;
} {
  const missileAlerts = alerts.filter((a) => String(a.category) === "1");
  const cat14Alerts = alerts.filter((a) => String(a.category) === "14");
  const cat13Alerts = alerts.filter((a) => String(a.category) === "13");
  if (missileAlerts.length === 0) {
    return { avgMs14to1: null, avgMs1to13: null, count14to1: 0, count1to13: 0 };
  }

  const sorted = [...missileAlerts].sort(
    (a, b) => new Date(a.alertDate).getTime() - new Date(b.alertDate).getTime()
  );

  const events: { time: number; locations: Set<string> }[] = [];
  for (const a of sorted) {
    const t = new Date(a.alertDate).getTime();
    const locs = getLocations(a.data ?? "");
    const last = events[events.length - 1];
    if (last && t - last.time <= EVENT_WINDOW_MS) {
      for (const loc of locs) last.locations.add(loc);
    } else {
      events.push({ time: t, locations: new Set(locs) });
    }
  }

  const byLoc14 = indexByLocation(cat14Alerts, (a) => new Date(a.alertDate).getTime());
  const byLoc13 = indexByLocation(cat13Alerts, (a) => new Date(a.alertDate).getTime());

  const deltas14to1: number[] = [];
  const deltas1to13: number[] = [];

  for (const ev of events) {
    let latest14 = -1;
    for (const loc of ev.locations) {
      const list = byLoc14.get(loc) ?? [];
      for (const { time } of list) {
        if (time < ev.time && ev.time - time <= FIFTEEN_MIN_MS && time > latest14) {
          latest14 = time;
        }
      }
    }
    if (latest14 >= 0) deltas14to1.push(ev.time - latest14);

    let first13 = Infinity;
    for (const loc of ev.locations) {
      const list = byLoc13.get(loc) ?? [];
      for (const { time } of list) {
        if (time > ev.time && time < first13) first13 = time;
      }
    }
    if (first13 < Infinity) deltas1to13.push(first13 - ev.time);
  }

  const avgMs14to1 =
    deltas14to1.length > 0
      ? deltas14to1.reduce((s, d) => s + d, 0) / deltas14to1.length
      : null;

  const deltas1to13Filtered = deltas1to13.filter((d) => d <= FIFTEEN_MIN_MS);
  const avgMs1to13 =
    deltas1to13Filtered.length > 0
      ? deltas1to13Filtered.reduce((s, d) => s + d, 0) / deltas1to13Filtered.length
      : null;

  return {
    avgMs14to1,
    avgMs1to13,
    count14to1: deltas14to1.length,
    count1to13: deltas1to13Filtered.length,
  };
}

export function formatDuration(ms: number): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  if (min < 60) return s > 0 ? `${min}m ${s}s` : `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Date with most alerts and its count. Returns null if no alerts. */
export function getPeakDay(alerts: Alert[]): { date: string; count: number } | null {
  if (alerts.length === 0) return null;
  const byDate: Record<string, number> = {};
  for (const a of alerts) {
    const d = a.alertDate ? getLocalDateString(a.alertDate) : null;
    if (!d) continue;
    byDate[d] = (byDate[d] ?? 0) + 1;
  }
  const entries = Object.entries(byDate);
  if (entries.length === 0) return null;
  const [date, count] = entries.reduce((best, curr) =>
    curr[1] > best[1] ? curr : best
  );
  return { date, count };
}
