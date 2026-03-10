import { NextRequest, NextResponse } from "next/server";
import { fetchAlertsHistory } from "@/lib/oref";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const daysParam = request.nextUrl.searchParams.get("days");
    const days = daysParam ? Math.min(365, Math.max(1, parseInt(daysParam, 10) || 90)) : 90;
    const data = await fetchAlertsHistory(days);
    return NextResponse.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch alerts";
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
