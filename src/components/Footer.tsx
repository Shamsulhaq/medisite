import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { t, UI, type Locale } from "@/lib/i18n";

export default function Footer({
  settings,
  locale,
}: {
  settings: SiteSettings;
  locale: Locale;
}) {
  const year = new Date().getFullYear();
  const { doctor, contact, menu, messages } = settings;

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-ink">{t(doctor.name, locale)}</p>
          <p className="mt-1 text-sm text-muted">
            {t(doctor.title, locale)}, {t(doctor.department, locale)}
          </p>
          <p className="text-sm text-muted">{t(doctor.hospital, locale)}</p>
          <p className="mt-3 max-w-xs text-sm text-muted">
            {t(doctor.tagline, locale)}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-ink">
            {t(UI.quickLinks, locale)}
          </p>
          <ul className="mt-3 space-y-2">
            {menu.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted transition hover:text-brand"
                >
                  {t(link.label, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-ink">
            {t(UI.contact, locale)}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <span className="font-medium text-ink">
                {t(UI.chamber, locale)}:
              </span>{" "}
              {t(contact.address, locale)}
            </li>
            <li>
              <span className="font-medium text-ink">
                {t(UI.hours, locale)}:
              </span>{" "}
              {t(contact.chamberHours, locale)}
            </li>
            <li>
              <span className="font-medium text-ink">
                {t(UI.phone, locale)}:
              </span>{" "}
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="transition hover:text-brand"
              >
                {contact.phone}
              </a>
            </li>
            <li>
              <span className="font-medium text-ink">
                {t(UI.email, locale)}:
              </span>{" "}
              <a
                href={`mailto:${contact.email}`}
                className="transition hover:text-brand"
              >
                {contact.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted sm:flex-row sm:px-6">
          <p>
            © {year} {t(doctor.name, locale)}. {t(UI.allRightsReserved, locale)}
          </p>
          <p>{t(messages.footerDisclaimer, locale)}</p>
        </div>
      </div>
    </footer>
  );
}
