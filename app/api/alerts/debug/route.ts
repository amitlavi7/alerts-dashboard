import { NextRequest, NextResponse } from "next/server";
import { fetchAlertsByDateRange } from "@/lib/oref";

/** Debug endpoint: GET /api/alerts/debug?from=25.02.2026&to=04.03.2026
 * Returns raw API response and analysis to help debug date/format issues.
 */
export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const format = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  const fromDate = from ?? format(start);
  const toDate = to ?? format(end);

  try {
    const rawItems = await fetchAlertsByDateRange(fromDate, toDate);

    const dateCounts: Record<string, number> = {};
    const sampleItems = rawItems.slice(0, 5);
    const sampleRaw = rawItems.slice(0, 3).map((item) => ({
      ...item,
      data: item.data?.slice(0, 50),
      keys: Object.keys(item),
    }));

    const newsFlash13 = rawItems.filter((i) => String(i.category) === "13");
    const newsFlash14 = rawItems.filter((i) => String(i.category) === "14");
    const category13vs14 = {
      count13: newsFlash13.length,
      count14: newsFlash14.length,
      sample13: newsFlash13.slice(0, 3).map((i) => ({ ...i, data: i.data?.slice(0, 50) })),
      sample14: newsFlash14.slice(0, 3).map((i) => ({ ...i, data: i.data?.slice(0, 50) })),
    };

    for (const item of rawItems) {
      const d = item.date ?? "unknown";
      dateCounts[d] = (dateCounts[d] ?? 0) + 1;
    }

    return NextResponse.json({
      request: { fromDate, toDate, url: `GetAlarmsHistory?fromDate=${fromDate}&toDate=${toDate}` },
      totalItems: rawItems.length,
      dateDistribution: dateCounts,
      uniqueDates: Object.keys(dateCounts).length,
      category13vs14,
      sampleRaw,
      sampleParsed: sampleItems.map((item) => ({
        date: item.date,
        time: item.time,
        data: item.data?.slice(0, 30),
        category: item.category,
        category_desc: item.category_desc,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
        request: { fromDate, toDate },
      },
      { status: 500 }
    );
  }
}
