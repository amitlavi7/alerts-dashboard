import { NextRequest, NextResponse } from "next/server";
import { fetchAlertsByDateRange } from "@/lib/oref";
import { fetchIsraelAlertsData } from "@/lib/sources/israelAlertsData";

/** Debug data sources: GET /api/alerts/debug-sources?from=2026-02-25&to=2026-03-04
 * Shows CSV vs Oref date coverage to diagnose missing data.
 */
export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 14);
  const fromDate = from ?? start.toISOString().slice(0, 10);
  const toDate = to ?? end.toISOString().slice(0, 10);

  const formatOref = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;

  try {
    const [csvAlerts, orefItems] = await Promise.all([
      fetchIsraelAlertsData(fromDate, toDate).catch((e) => {
        console.error("CSV fetch error:", e);
        return [];
      }),
      fetchAlertsByDateRange(formatOref(new Date(fromDate)), formatOref(new Date(toDate))).catch(
        (e) => {
          console.error("Oref fetch error:", e);
          return [];
        }
      ),
    ]);

    const csvByDate: Record<string, number> = {};
    const orefByDate: Record<string, number> = {};
    const csvHaifa: { date: string; data: string }[] = [];
    const orefHaifa: { date: string; data: string }[] = [];

    const haifaMatch = (d: string) =>
      /חיפה|נווה שאנן|רמות כרמל/.test(d) || /חיפה\s*\d+/.test(d);

    for (const a of csvAlerts) {
      const d = a.alertDate.slice(0, 10);
      csvByDate[d] = (csvByDate[d] ?? 0) + 1;
      if (haifaMatch(a.data)) csvHaifa.push({ date: d, data: a.data.slice(0, 60) });
    }

    for (const item of orefItems) {
      const raw = item.alertDate ?? item.date;
      let iso = "unknown";
      if (raw) {
        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) {
          iso = parsed.toISOString().slice(0, 10);
        } else if (typeof item.date === "string" && item.date.match(/\d{2}\.\d{2}\.\d{4}/)) {
          const [dd, mm, yyyy] = item.date.split(".");
          iso = `${yyyy}-${mm}-${dd}`;
        }
      }
      if (iso !== "unknown") {
        orefByDate[iso] = (orefByDate[iso] ?? 0) + 1;
        if (haifaMatch(item.data ?? ""))
          orefHaifa.push({ date: iso, data: (item.data ?? "").slice(0, 60) });
      }
    }

    const allDates = new Set([...Object.keys(csvByDate), ...Object.keys(orefByDate)]);
    const dateBreakdown = Array.from(allDates)
      .sort()
      .map((d) => ({
        date: d,
        csv: csvByDate[d] ?? 0,
        oref: orefByDate[d] ?? 0,
      }));

    return NextResponse.json({
      request: { fromDate, toDate },
      csv: { total: csvAlerts.length, byDate: csvByDate, haifaSample: csvHaifa.slice(0, 10) },
      oref: { total: orefItems.length, byDate: orefByDate, haifaSample: orefHaifa.slice(0, 10) },
      dateBreakdown,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown",
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}
