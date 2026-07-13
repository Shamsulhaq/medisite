import { getSettings } from '@/lib/store';
import { getLocale } from '@/lib/i18n-server';
import { t, UI, type Locale, type LocalizedString } from '@/lib/i18n';
import AppointmentForm from '@/components/AppointmentForm';
import Icon from '@/components/Icon';

type Props = {
  locale: Locale;
  heading: LocalizedString;
  subtitle: LocalizedString;
  showSidebar: boolean;
};

/**
 * AppointmentFormEmbedBlock — async server component that renders the
 * appointment booking form (or an "unavailable" message) matching the
 * existing appointment page pattern.
 */
export default async function AppointmentFormEmbedBlock({
  locale,
  heading,
  subtitle,
  showSidebar,
}: Props) {
  const settings = await getSettings();
  const resolvedLocale = locale ?? (await getLocale(settings.defaultLanguage));
  const { contact, messages, appointment, appointmentsEnabled } = settings;

  const bookingOpen =
    appointmentsEnabled &&
    (appointment.chambers.length > 0 || appointment.online.enabled);

  const headingText = t(heading, resolvedLocale) || t(UI.bookAppointment, resolvedLocale);
  const subtitleText = t(subtitle, resolvedLocale);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Section header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-ink">{headingText}</h2>
        {subtitleText && (
          <p className="mt-2 max-w-2xl text-muted">{subtitleText}</p>
        )}
      </div>

      {/* Form or unavailable notice */}
      <div
        className={
          showSidebar ? 'grid gap-10 lg:grid-cols-3' : ''
        }
      >
        <div className={showSidebar ? 'lg:col-span-2' : ''}>
          {bookingOpen ? (
            <AppointmentForm
              appointment={appointment}
              successMessage={t(messages.appointmentSuccess, resolvedLocale)}
              locale={resolvedLocale}
            />
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Icon name="calendar" className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">
                {t(UI.bookingUnavailable, resolvedLocale)}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {t(UI.bookingUnavailableMsg, resolvedLocale)}
              </p>
              <a
                href={`tel:${contact.phone.replace(/\s/g, '')}`}
                className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                {contact.phone}
              </a>
            </div>
          )}
        </div>

        {showSidebar && (
          <aside className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-ink">
                {t(UI.chamberInfo, resolvedLocale)}
              </h3>
              <ul className="mt-4 space-y-4 text-sm text-muted">
                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                    <Icon name="location" className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-medium text-ink">
                      {t(UI.location, resolvedLocale)}
                    </span>
                    {t(contact.address, resolvedLocale)}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                    <Icon name="clock" className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-medium text-ink">
                      {t(UI.hours, resolvedLocale)}
                    </span>
                    {t(contact.chamberHours, resolvedLocale)}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                    <Icon name="phone" className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-medium text-ink">
                      {t(UI.phone, resolvedLocale)}
                    </span>
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, '')}`}
                      className="transition hover:text-brand"
                    >
                      {contact.phone}
                    </a>
                  </span>
                </li>
              </ul>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
