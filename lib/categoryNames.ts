/**
 * Oref historical alert category codes to display names.
 * Based on pikud-haoref-api getAlertTypeByHistoricalCategory mapping.
 */
export const CATEGORY_NAMES: Record<string, string> = {
  "1": "Missiles",
  "2": "Hostile aircraft intrusion",
  "3": "General",
  "4": "General",
  "5": "General",
  "6": "General",
  "7": "Earthquake",
  "8": "Earthquake",
  "9": "Radiological event",
  "10": "Terrorist infiltration",
  "11": "Tsunami",
  "12": "Hazardous materials",
  "13": "News flash", // האירוע הסתיים	
  "14": "News flash", // בדקות הקרובות צפויות להתקבל התרעות באזורך	
  "15": "Missiles (drill)",
  "16": "Hostile aircraft (drill)",
  "17": "General (drill)",
  "18": "General (drill)",
  "19": "General (drill)",
  "20": "General (drill)",
  "21": "Earthquake (drill)",
  "22": "Earthquake (drill)",
  "23": "Radiological (drill)",
  "24": "Terrorist infiltration (drill)",
  "25": "Tsunami (drill)",
  "26": "Hazardous materials (drill)",
};

export function getCategoryDisplayName(category: string, categoryDesc?: string): string {
  if (category in CATEGORY_NAMES) return CATEGORY_NAMES[category];
  if (categoryDesc?.trim()) return categoryDesc;
  return category ?? "Unknown";
}

const NEWS_FLASH_CATEGORIES = new Set(["13", "14"]);

/** Drill categories are 15-26. */
const DRILL_CATEGORY_MIN = 15;
const DRILL_CATEGORY_MAX = 26;

export function isNewsFlash(category: string): boolean {
  return NEWS_FLASH_CATEGORIES.has(String(category));
}

export function isDrill(category: string): boolean {
  const n = parseInt(String(category), 10);
  return !Number.isNaN(n) && n >= DRILL_CATEGORY_MIN && n <= DRILL_CATEGORY_MAX;
}
