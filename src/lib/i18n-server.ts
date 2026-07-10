// Server-only locale helper (uses next/headers). Import from server components.

import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE, type Locale } from "./i18n";

/** Read the active locale from the cookie, falling back to a default. */
export async function getLocale(fallback: Locale = "en"): Promise<Locale> {
  const store = await cookies();
  const v = store.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : fallback;
}
