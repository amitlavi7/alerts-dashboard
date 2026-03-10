/**
 * Historical alerts from dleshem/israel-alerts-data (GitHub).
 * CSV format: data,date,time,alertDate,category,category_desc,matrix_id,rid
 * Data from 2014 onwards. Uses Range request to fetch only the tail (recent data) for speed.
 */
const CSV_URL =
  "https://raw.githubusercontent.com/dleshem/israel-alerts-data/main/israel-alerts.csv";

/** CSV is ~31MB, sorted by date. Tail 24MB covers recent months (avoids missing pre-March data). */
const TAIL_BYTES = 24 * 1024 * 1024;

export interface CsvAlert {
  data: string;
  alertDate: string;
  category: string;
  category_desc: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      const end = line.indexOf('"', i + 1);
      if (end === -1) break;
      result.push(line.slice(i + 1, end));
      i = end + 1;
      if (line[i] === ",") i++;
    } else {
      const end = line.indexOf(",", i);
      if (end === -1) {
        result.push(line.slice(i).trim());
        break;
      }
      result.push(line.slice(i, end).trim());
      i = end + 1;
    }
  }
  return result;
}

export async function fetchIsraelAlertsData(
  fromDate: string,
  toDate: string
): Promise<CsvAlert[]> {
  const fromTime = new Date(fromDate + "T00:00:00").getTime();
  const toTime = new Date(toDate + "T23:59:59").getTime();

  const res = await fetch(CSV_URL, {
    headers: {
      "User-Agent": "AlertsDashboard/1.0",
      Range: `bytes=-${TAIL_BYTES}`,
    },
    cache: "no-store",
  });
  if (!res.ok && res.status !== 206) throw new Error(`CSV fetch failed: ${res.status}`);
  const text = await res.text();

  const lines = text.split("\n");
  let startIdx = 0;
  if (lines[0]?.toLowerCase().includes("alertdate")) {
    startIdx = 1;
  } else if (lines[0] && (lines[0].split(",").length < 4 || lines[0].length > 500)) {
    startIdx = 1;
  }
  const alerts: CsvAlert[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 5) continue;
    const [data, , , alertDateStr, category, category_desc] = cols;
    const alertDate = alertDateStr?.trim();
    if (!alertDate) continue;
    const t = new Date(alertDate).getTime();
    if (Number.isNaN(t) || t < fromTime || t > toTime) continue;
    alerts.push({
      data: data?.trim() ?? "",
      alertDate,
      category: category?.trim() ?? "",
      category_desc: category_desc?.trim() ?? "",
    });
  }
  return alerts;
}
