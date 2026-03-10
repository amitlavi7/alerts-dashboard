const OREF_GET_ALARMS_HISTORY_URL =
  "https://alerts-history.oref.org.il/Shared/Ajax/GetAlarmsHistory.aspx";

const OREF_HEADERS: Record<string, string> = {
  Referer: "https://alerts-history.oref.org.il/",
  "X-Requested-With": "XMLHttpRequest",
  "User-Agent": "Mozilla/5.0 (compatible; AlertsDashboard/1.0)",
};

/** Format date as DD.MM.YYYY for GetAlarmsHistory API */
function formatDateForApi(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

interface GetAlarmsHistoryItem {
  date?: string;
  time?: string;
  data?: string;
  category?: string | number;
  category_desc?: string;
  alertDate?: string;
  [key: string]: unknown;
}

function parseAlertDate(item: GetAlarmsHistoryItem): string {
  if (item.alertDate) {
    const parsed = new Date(item.alertDate);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  const date = item.date ?? "";
  const time = item.time ?? "00:00";
  const [hours, minutes] = time.split(":").map(Number);
  const parts = date.split(/[.\/-]/);
  let y: number, m: number, d: number;
  if (parts.length >= 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    if (p0 > 31) {
      y = p0;
      m = p1;
      d = p2;
    } else {
      d = p0;
      m = p1;
      y = p2;
    }
  } else {
    return new Date().toISOString();
  }
  const parsed = new Date(y, m - 1, d, hours || 0, minutes || 0);
  return parsed.toISOString();
}

/** Fetch historical alerts by date range (DD.MM.YYYY). Returns normalized Alert-like objects. */
export async function fetchAlertsByDateRange(
  fromDate: string,
  toDate: string
): Promise<GetAlarmsHistoryItem[]> {
  const url = `${OREF_GET_ALARMS_HISTORY_URL}?lang=he&fromDate=${fromDate}&toDate=${toDate}&mode=0`;
  const res = await fetch(url, {
    headers: OREF_HEADERS,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`GetAlarmsHistory returned ${res.status}`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.alerts)) return data.alerts;
  return [];
}

/** Fetch alerts from the last N days. Uses israel-alerts-data CSV (2014+) + GetAlarmsHistory for recent. */
export async function fetchAlertsHistory(daysBack = 90): Promise<unknown> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  const fromDate = start.toISOString().slice(0, 10);
  const toDate = end.toISOString().slice(0, 10);

  const results: Array<{ data: string; alertDate: string; category: string; category_desc: string }> = [];
  const seen = new Set<string>();

  const addUnique = (item: { data: string; alertDate: string; category: string; category_desc: string }) => {
    const key = `${item.alertDate}-${item.data}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(item);
  };

  const recentStart = new Date(end);
  recentStart.setDate(recentStart.getDate() - 14);
  const recentFrom = formatDateForApi(recentStart);
  const recentTo = formatDateForApi(end);

  const [csvAlerts, apiItems] = await Promise.all([
    import("@/lib/sources/israelAlertsData")
      .then((m) => m.fetchIsraelAlertsData(fromDate, toDate))
      .catch(() => []),
    fetchAlertsByDateRange(recentFrom, recentTo).catch(() => []),
  ]);

  for (const a of csvAlerts) addUnique(a);
  for (const item of apiItems) {
    addUnique({
      data: item.data ?? "",
      alertDate: parseAlertDate(item),
      category: String(item.category ?? ""),
      category_desc: (item.category_desc as string) ?? "",
    });
  }

  return results.sort(
    (a, b) => new Date(a.alertDate).getTime() - new Date(b.alertDate).getTime()
  );
}
