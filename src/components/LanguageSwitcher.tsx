"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_LABELS,
  type Locale,
} from "@/lib/i18n";

export default function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function setLocale(locale: Locale) {
    if (locale === current) return;
    // 1 year cookie
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="inline-flex overflow-hidden rounded-full border border-slate-300 text-xs font-medium">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => setLocale(locale)}
          aria-pressed={current === locale}
          className={`px-2.5 py-1 transition ${
            current === locale
              ? "bg-brand text-white"
              : "bg-white text-muted hover:bg-slate-50"
          }`}
        >
          {LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
