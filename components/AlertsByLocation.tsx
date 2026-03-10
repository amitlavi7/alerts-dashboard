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
  Cell,
} from "recharts";
import { getAlertsByCity } from "@/lib/dateUtils";
import { getColorForIndex } from "@/lib/chartColors";
import type { Alert } from "@/lib/types";

const TOP_N = 15;

interface LocationDataPoint {
  location: string;
  count?: number;
  [key: string]: string | number | undefined;
}

function aggregateByLocation(alerts: Alert[]): LocationDataPoint[] {
  const byLoc: Record<string, number> = {};
  for (const a of alerts) {
    const loc = a.data?.trim() || "Unknown";
    if (!loc) continue;
    byLoc[loc] = (byLoc[loc] ?? 0) + 1;
  }
  return Object.entries(byLoc)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N);
}

function aggregateByCity(alertsByCity: Record<string, Alert[]>, cities: string[]): LocationDataPoint[] {
  return cities.map((city) => ({
    location: city,
    count: (alertsByCity[city] ?? []).length,
  }));
}

export function AlertsByLocation({
  alerts,
  selectedCities,
}: {
  alerts: Alert[];
  selectedCities: string[];
}) {
  const multiCity = selectedCities.length > 1;
  const data = multiCity
    ? aggregateByCity(getAlertsByCity(alerts, selectedCities), selectedCities)
    : aggregateByLocation(alerts);

  if (data.length === 0) return null;

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
        <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
          <XAxis type="number" tick={{ fontSize: 12 }} className="text-zinc-600 dark:text-zinc-400" />
          <YAxis
            type="category"
            dataKey="location"
            width={100}
            tick={{ fontSize: 11 }}
            className="text-zinc-600 dark:text-zinc-400"
          />
          <Tooltip active={activeOverride} contentStyle={tooltipStyle} />
          <Bar
            dataKey="count"
            fill={multiCity ? undefined : "hsl(var(--chart-3))"}
            radius={[0, 4, 4, 0]}
          >
            {multiCity && data.map((_, i) => <Cell key={i} fill={getColorForIndex(i)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
