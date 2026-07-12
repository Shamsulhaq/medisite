// -----------------------------------------------------------------------------
// Shared utility functions.
// -----------------------------------------------------------------------------

/**
 * Returns today's date as YYYY-MM-DD in Bangladesh timezone (Asia/Dhaka, UTC+6).
 * Use this instead of `new Date().toISOString().split('T')[0]` for appointment
 * and consultation date comparisons to avoid UTC-offset issues.
 */
export function todayInBD(): string {
  const now = new Date();
  // Asia/Dhaka is always UTC+6 (no DST)
  const bd = new Date(now.getTime() + (6 * 60 + now.getTimezoneOffset()) * 60000);
  const y = bd.getFullYear();
  const m = String(bd.getMonth() + 1).padStart(2, "0");
  const d = String(bd.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Map a free-text patient age (e.g. "45", "45 years", "6 months") into a coarse
 * age group used for disease+age prescription templates. Dosing differs mainly
 * by these bands, so templates are keyed per group. Returns "" if unknown.
 */
export function ageGroupOf(age: string): string {
  if (!age) return "";
  const s = age.toLowerCase();
  // Sub-year units without an explicit year => infant.
  if (/(month|week|day)/.test(s) && !/(year|yr)/.test(s)) return "Infant";
  const m = s.match(/\d+/);
  if (!m) return "";
  const years = parseInt(m[0], 10);
  if (Number.isNaN(years)) return "";
  if (years < 1) return "Infant";
  if (years <= 12) return "Child";
  if (years <= 17) return "Teen";
  if (years <= 59) return "Adult";
  return "Elderly";
}
