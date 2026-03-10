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
import { getCategoryDisplayName } from "@/lib/categoryNames";
import { getAlertsByCity } from "@/lib/dateUtils";
import { getColorForIndex } from "@/lib/chartColors";
import type { Alert } from "@/lib/types";

interface CategoryDataPoint {
  category: string;
  count?: number;
  [key: string]: string | number | undefined;
}

function aggregateByCategory(alerts: Alert[]): CategoryDataPoint[] {
  const byCat: Record<string, number> = {};
  for (const a of alerts) {
    const cat = getCategoryDisplayName(a.category, a.category_desc);
    byCat[cat] = (byCat[cat] ?? 0) + 1;
  }
  return Object.entries(byCat)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
}

function aggregateByCategoryAndCity(
  alertsByCity: Record<string, Alert[]>,
  cities: string[]
): CategoryDataPoint[] {
  const byCat: Record<string, Record<string, number>> = {};
  for (const city of cities) {
    const cityAlerts = alertsByCity[city] ?? [];
    for (const a of cityAlerts) {
      const cat = getCategoryDisplayName(a.category, a.category_desc);
      if (!byCat[cat]) byCat[cat] = {};
      byCat[cat][city] = (byCat[cat][city] ?? 0) + 1;
    }
  }
  const points: CategoryDataPoint[] = Object.entries(byCat).map(([category, counts]) => ({
    category,
    ...counts,
  }));
  return points.sort((a, b) => {
    const sumA = cities.reduce((s, c) => s + (Number(a[c]) || 0), 0);
    const sumB = cities.reduce((s, c) => s + (Number(b[c]) || 0), 0);
    return sumB - sumA;
  });
}

export function AlertsByCategory({
  alerts,
  selectedCities,
}: {
  alerts: Alert[];
  selectedCities: string[];
}) {
  const multiCity = selectedCities.length > 1;
  const data = multiCity
    ? aggregateByCategoryAndCity(getAlertsByCity(alerts, selectedCities), selectedCities)
    : aggregateByCategory(alerts);

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
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
          <XAxis type="number" tick={{ fontSize: 12 }} className="text-zinc-600 dark:text-zinc-400" />
          <YAxis
            type="category"
            dataKey="category"
            width={80}
            tick={{ fontSize: 11 }}
            className="text-zinc-600 dark:text-zinc-400"
          />
          <Tooltip active={activeOverride} contentStyle={tooltipStyle} />
          {multiCity ? (
            <>
              {selectedCities.map((city, i) => (
                <Bar
                  key={city}
                  dataKey={city}
                  name={city}
                  stackId="1"
                  fill={getColorForIndex(i)}
                  radius={i === selectedCities.length - 1 ? [0, 4, 4, 0] : 0}
                />
              ))}
              <Legend />
            </>
          ) : (
            <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
