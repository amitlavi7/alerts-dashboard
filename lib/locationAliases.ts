/**
 * Location aliases: Oref uses neighborhood names (e.g. "חיפה - נווה שאנן ורמות כרמל")
 * while CSV uses zone codes (e.g. "חיפה 75"). Map display names to equivalent zone codes.
 */
const LOCATION_ALIASES: Record<string, string[]> = {
  "חיפה - נווה שאנן ורמות כרמל": ["חיפה 75", "חיפה 79", "חיפה 80"],
};

/** Get all location strings that should match when user selects this location. */
export function getLocationMatchStrings(location: string): string[] {
  const trimmed = location.trim();
  const norm = trimmed.toLowerCase();
  const aliases = LOCATION_ALIASES[trimmed] ?? [];
  return [norm, ...aliases.map((a) => a.toLowerCase())];
}
