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
