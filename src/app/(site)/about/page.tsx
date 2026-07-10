import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/store";
import { t, UI } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import Icon from "@/components/Icon";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const locale = await getLocale(s.defaultLanguage);
  return {
    title: t(UI.aboutLabel, locale),
    description: `${t(s.doctor.name, locale)} — ${t(s.doctor.title, locale)}, ${t(
      s.doctor.hospital,
      locale
    )}`,
  };
}

export default async function AboutPage() {
  const settings = await getSettings();
  const locale = await getLocale(settings.defaultLanguage);
  const { doctor, specialties, education, experience, contact } = settings;

  const name = t(doctor.name, locale);
  const bioParagraphs = t(doctor.bio, locale)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <section className="bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
          {doctor.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doctor.photo}
              alt={name}
              className="h-28 w-28 rounded-2xl object-cover ring-1 ring-slate-200"
            />
          )}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
              {t(UI.aboutLabel, locale)}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">
              {name}
            </h1>
            <p className="mt-2 text-lg text-muted">
              {t(doctor.title, locale)}, {t(doctor.department, locale)} ·{" "}
              {t(doctor.hospital, locale)}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-ink">
            {t(UI.biography, locale)}
          </h2>
          <div className="prose-content mt-4 text-muted">
            {bioParagraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {experience.length > 0 && (
            <>
              <h2 className="mt-12 text-xl font-bold text-ink">
                {t(UI.experienceHeading, locale)}
              </h2>
              <ol className="mt-6 space-y-6 border-l-2 border-brand-light pl-6">
                {experience.map((item, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-brand bg-white" />
                    <p className="font-semibold text-ink">
                      {t(item.role, locale)}
                    </p>
                    <p className="text-sm text-brand">{t(item.place, locale)}</p>
                    <p className="text-xs uppercase tracking-wide text-muted">
                      {t(item.period, locale)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {t(item.description, locale)}
                    </p>
                  </li>
                ))}
              </ol>
            </>
          )}

          {education.length > 0 && (
            <>
              <h2 className="mt-12 text-xl font-bold text-ink">
                {t(UI.educationHeading, locale)}
              </h2>
              <ul className="mt-6 space-y-4">
                {education.map((edu, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                      <Icon name="book" className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-ink">
                        {t(edu.degree, locale)}
                      </p>
                      <p className="text-sm text-muted">
                        {t(edu.institution, locale)} · {edu.year}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="space-y-8">
          {specialties.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-ink">
                {t(UI.areasOfCare, locale)}
              </h3>
              <ul className="mt-4 space-y-3">
                {specialties.map((s, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                      <Icon name={s.icon} className="h-4 w-4" />
                    </span>
                    <span className="text-sm text-ink">{t(s.title, locale)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-ink">
              {t(UI.chamberContact, locale)}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li className="flex items-start gap-3">
                <Icon name="location" className="mt-0.5 h-4 w-4 text-brand" />
                <span>{t(contact.address, locale)}</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="clock" className="mt-0.5 h-4 w-4 text-brand" />
                <span>{t(contact.chamberHours, locale)}</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="phone" className="mt-0.5 h-4 w-4 text-brand" />
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="transition hover:text-brand"
                >
                  {contact.phone}
                </a>
              </li>
            </ul>
            <Link
              href="/appointment"
              className="mt-5 block rounded-full bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              {t(UI.bookAppointment, locale)}
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
