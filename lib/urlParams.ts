export interface DashboardParams {
  start?: string;
  end?: string;
  cities?: string[];
  excludeDrills?: boolean;
}

const PARAM_START = "s";
const PARAM_END = "e";
const PARAM_CITIES = "c";
const PARAM_EXCLUDE_DRILLS = "x";

export function parseDashboardParams(searchParams: URLSearchParams): Partial<DashboardParams> {
  const start = searchParams.get(PARAM_START) ?? searchParams.get("start");
  const end = searchParams.get(PARAM_END) ?? searchParams.get("end");
  const citiesRaw = searchParams.get(PARAM_CITIES) ?? searchParams.get("cities");
  const excludeDrills = searchParams.get(PARAM_EXCLUDE_DRILLS) ?? searchParams.get("excludeDrills");

  const result: Partial<DashboardParams> = {};
  if (start && /^\d{4}-\d{2}-\d{2}$/.test(start)) result.start = start;
  if (end && /^\d{4}-\d{2}-\d{2}$/.test(end)) result.end = end;
  if (citiesRaw) {
    const cities = citiesRaw
      .split(",")
      .map((c) => decodeURIComponent(c.trim()))
      .filter(Boolean);
    if (cities.length > 0) result.cities = cities;
  }
  if (excludeDrills === "1" || excludeDrills === "true") result.excludeDrills = true;

  return result;
}

export function serializeDashboardParams(params: DashboardParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.start) sp.set(PARAM_START, params.start);
  if (params.end) sp.set(PARAM_END, params.end);
  if (params.cities?.length) {
    sp.set(PARAM_CITIES, params.cities.map((c) => encodeURIComponent(c)).join(","));
  }
  if (params.excludeDrills) sp.set(PARAM_EXCLUDE_DRILLS, "1");
  return sp;
}
