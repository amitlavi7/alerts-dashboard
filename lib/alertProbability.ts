import type { Alert } from "./types";

export interface LocationProbability {
  location: string;
  probability: number;
  count: number;
}

export interface TimeProbability {
  hour: number;
  hourLabel: string;
  probability: number;
}

export interface NextAlertTimePrediction {
  time: string;
  isTomorrow: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Get top locations by historical frequency (probability distribution). */
export function getLocationProbabilities(alerts: Alert[]): LocationProbability[] {
  const byLoc: Record<string, number> = {};
  for (const a of alerts) {
    const loc = (a.data ?? "").trim() || "Unknown";
    byLoc[loc] = (byLoc[loc] ?? 0) + 1;
  }
  const total = alerts.length || 1;
  return Object.entries(byLoc)
    .map(([location, count]) => ({
      location,
      count,
      probability: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.probability - a.probability);
}

/** Get hour-of-day distribution for alerts (probability per hour). */
export function getHourProbabilities(alerts: Alert[]): TimeProbability[] {
  const byHour: Record<number, number> = {};
  for (let h = 0; h < 24; h++) byHour[h] = 0;
  for (const a of alerts) {
    if (!a.alertDate) continue;
    const hour = new Date(a.alertDate).getHours();
    byHour[hour]++;
  }
  const total = alerts.length || 1;
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    hourLabel: `${h.toString().padStart(2, "0")}:00`,
    probability: Math.round((byHour[h] / total) * 1000) / 10,
  }));
}

/** Get day-of-week distribution for alerts. */
export function getDayOfWeekProbabilities(alerts: Alert[]): { day: string; probability: number }[] {
  const byDay: Record<number, number> = {};
  for (let d = 0; d < 7; d++) byDay[d] = 0;
  for (const a of alerts) {
    if (!a.alertDate) continue;
    const day = new Date(a.alertDate).getDay();
    byDay[day]++;
  }
  const total = alerts.length || 1;
  return Array.from({ length: 7 }, (_, d) => ({
    day: DAY_NAMES[d],
    probability: Math.round((byDay[d] / total) * 1000) / 10,
  }));
}

/** Get the most likely hour for alerts. */
export function getMostLikelyHour(alerts: Alert[]): TimeProbability | null {
  const hours = getHourProbabilities(alerts);
  const best = hours.reduce((a, b) => (a.probability > b.probability ? a : b));
  return best.probability > 0 ? best : null;
}

/** Get the most likely day of week for alerts. */
export function getMostLikelyDay(alerts: Alert[]): { day: string; probability: number } | null {
  const days = getDayOfWeekProbabilities(alerts);
  const best = days.reduce((a, b) => (a.probability > b.probability ? a : b));
  return best.probability > 0 ? best : null;
}

/** Predict next alert time based on current time and historical distribution. */
export function getNextAlertTime(
  alerts: Alert[],
  now: Date = new Date()
): NextAlertTimePrediction | null {
  const byHour: Record<number, { count: number; minutes: number[] }> = {};
  for (let h = 0; h < 24; h++) byHour[h] = { count: 0, minutes: [] };

  for (const a of alerts) {
    if (!a.alertDate) continue;
    const d = new Date(a.alertDate);
    const hour = d.getHours();
    const minute = d.getMinutes();
    byHour[hour].count++;
    byHour[hour].minutes.push(minute);
  }

  const currentHour = now.getHours();
  let bestHour = -1;
  let bestCount = 0;

  for (let h = currentHour; h < 24; h++) {
    if (byHour[h].count > bestCount) {
      bestCount = byHour[h].count;
      bestHour = h;
    }
  }
  if (bestHour === -1) {
    for (let h = 0; h < currentHour; h++) {
      if (byHour[h].count > bestCount) {
        bestCount = byHour[h].count;
        bestHour = h;
      }
    }
  }
  if (bestHour === -1) {
    for (let h = 0; h < 24; h++) {
      if (byHour[h].count > bestCount) {
        bestCount = byHour[h].count;
        bestHour = h;
      }
    }
  }

  if (bestHour === -1 || bestCount === 0) return null;

  const currentMinute = now.getMinutes();
  let resultHour = bestHour;
  let typicalMinute: number;

  if (bestHour === currentHour) {
    const futureMinutes = byHour[bestHour].minutes.filter((m) => m > currentMinute);
    if (futureMinutes.length > 0) {
      typicalMinute = Math.round(
        futureMinutes.reduce((a, b) => a + b, 0) / futureMinutes.length
      );
    } else {
      const nextHour = (currentHour + 1) % 24;
      if (byHour[nextHour]?.count > 0) {
        resultHour = nextHour;
        const minutes = byHour[nextHour].minutes;
        typicalMinute =
          minutes.length > 0
            ? Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length)
            : 0;
      } else {
        typicalMinute = Math.min(59, currentMinute + 1);
      }
    }
  } else {
    const minutes = byHour[bestHour].minutes;
    typicalMinute =
      minutes.length > 0
        ? Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length)
        : 0;
  }

  if (resultHour === currentHour && typicalMinute <= currentMinute) {
    const nextHour = (currentHour + 1) % 24;
    if (byHour[nextHour]?.count > 0) {
      resultHour = nextHour;
      const minutes = byHour[nextHour].minutes;
      typicalMinute =
        minutes.length > 0
          ? Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length)
          : 0;
    } else {
      typicalMinute = Math.min(59, currentMinute + 1);
    }
  }

  const clampedMinute = Math.min(59, Math.max(0, typicalMinute));
  const time = `${resultHour.toString().padStart(2, "0")}:${clampedMinute.toString().padStart(2, "0")}`;

  const isTomorrow = resultHour < currentHour;

  return { time, isTomorrow };
}
