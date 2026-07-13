import type { Metadata } from "next";
import { getSettings } from "@/lib/store";
import { getLocale } from "@/lib/i18n-server";
import { t, UI } from "@/lib/i18n";
import Icon from "@/components/Icon";
import AppointmentForm from "@/components/AppointmentForm";
import { getPageBlocks } from "@/lib/page-builder/data";
import { renderBlock, type BlockContext } from "@/components/blocks";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const locale = await getLocale(s.defaultLanguage);
  return {
    title: t(UI.bookAppointment, locale),
    description: `${t(UI.bookAppointment, locale)} — ${t(s.doctor.name, locale)}`,
  };
}

export default async function AppointmentPage() {
  const settings = await getSettings();
  const locale = await getLocale(settings.defaultLanguage);
  const { doctor, contact, messages, appointment, appointmentsEnabled } =
    settings;
  const bookingOpen =
    appointmentsEnabled &&
    (appointment.chambers.length > 0 || appointment.online.enabled);

  const name = t(doctor.name, locale);
  const initials =
    doctor.initials?.trim() ||
    name
      .replace(/^Dr\.?\s*|^ডা\.?\s*/i, "")
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("");

  // --- Page Builder: render blocks if configured ---
  const blocks = await getPageBlocks("appointment");

  if (blocks.length > 0) {
    const context: BlockContext = {
      doctorName: name,
      doctorPhoto: doctor.photo || undefined,
      doctorInitials: initials,
    };
    return (
      <>
        {blocks.map((block) => renderBlock(block, locale, context))}
      </>
    );
  }

  // --- Fallback: existing hardcoded layout (used until a template is applied) ---
  return (
    <>
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            {t(UI.appointmentsLabel, locale)}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">
            {t(UI.bookAppointment, locale)}
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            {bookingOpen
              ? t(messages.appointmentIntro, locale)
              : t(UI.bookingUnavailableMsg, locale)}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {bookingOpen ? (
            <AppointmentForm
              appointment={appointment}
              successMessage={t(messages.appointmentSuccess, locale)}
              locale={locale}
            />
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Icon name="calendar" className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">
                {t(UI.bookingUnavailable, locale)}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {t(UI.bookingUnavailableMsg, locale)}
              </p>
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                {contact.phone}
              </a>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-ink">
              {t(UI.chamberInfo, locale)}
            </h2>
            <ul className="mt-4 space-y-4 text-sm text-muted">
              <li className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                  <Icon name="location" className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-medium text-ink">
                    {t(UI.location, locale)}
                  </span>
                  {t(contact.address, locale)}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                  <Icon name="clock" className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-medium text-ink">
                    {t(UI.hours, locale)}
                  </span>
                  {t(contact.chamberHours, locale)}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                  <Icon name="phone" className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-medium text-ink">
                    {t(UI.phone, locale)}
                  </span>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="transition hover:text-brand"
                  >
                    {contact.phone}
                  </a>
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-brand-light bg-brand-light/40 p-6">
            <h2 className="flex items-center gap-2 font-semibold text-brand-dark">
              <Icon name="shield" className="h-5 w-5" />
              {t(UI.forEmergencies, locale)}
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              {t(messages.emergencyNotice, locale)}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
