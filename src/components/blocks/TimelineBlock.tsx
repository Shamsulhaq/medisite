import { t, type Locale, type LocalizedString } from '@/lib/i18n';

type TimelineItem = {
  role: LocalizedString;
  place: LocalizedString;
  period: LocalizedString;
  description: LocalizedString;
};

type Props = {
  locale: Locale;
  heading: LocalizedString;
  items: TimelineItem[];
};

/**
 * TimelineBlock — renders a vertical timeline with a left border and dot markers.
 * Matches the experience section style from the About page.
 */
export default function TimelineBlock({ locale, heading, items }: Props) {
  const headingText = t(heading, locale);

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {headingText && (
        <h2 className="text-xl font-bold text-ink">{headingText}</h2>
      )}

      {items.length > 0 && (
        <ol className="mt-6 space-y-6 border-l-2 border-brand-light pl-6">
          {items.map((item, i) => (
            <li key={i} className="relative">
              {/* Dot marker */}
              <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-brand bg-white" />
              <p className="font-semibold text-ink">{t(item.role, locale)}</p>
              <p className="text-sm text-brand">{t(item.place, locale)}</p>
              <p className="text-xs uppercase tracking-wide text-muted">
                {t(item.period, locale)}
              </p>
              {t(item.description, locale) && (
                <p className="mt-1 text-sm text-muted">
                  {t(item.description, locale)}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
