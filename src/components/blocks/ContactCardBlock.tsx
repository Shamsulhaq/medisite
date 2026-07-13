import { t, type Locale, type LocalizedString } from '@/lib/i18n';
import Icon from '@/components/Icon';

type ContactItem = {
  icon: string;
  label: LocalizedString;
  value: string;
  href: string;
};

type Props = {
  locale: Locale;
  heading: LocalizedString;
  items: ContactItem[];
};

/**
 * ContactCardBlock — renders a card with icon + label + value rows,
 * styled like the chamber info cards on the About/Appointment pages.
 */
export default function ContactCardBlock({ locale, heading, items }: Props) {
  const headingText = t(heading, locale);

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {headingText && (
          <h3 className="font-semibold text-ink">{headingText}</h3>
        )}

        {items.length > 0 && (
          <ul className="mt-4 space-y-4 text-sm text-muted">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                  <Icon name={item.icon} className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-medium text-ink">
                    {t(item.label, locale)}
                  </span>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="transition hover:text-brand"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span>{item.value}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
