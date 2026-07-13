import Link from 'next/link';
import { t, type LocalizedString } from '@/lib/i18n';

type CTABannerBlockProps = {
  locale: 'en' | 'bn';
  heading: LocalizedString;
  subtitle: LocalizedString;
  buttonLabel: LocalizedString;
  buttonHref: string;
  variant: 'dark' | 'brand' | 'light';
};

const variantStyles = {
  dark: {
    section: 'bg-brand-dark',
    heading: 'text-white',
    subtitle: 'text-teal-100',
    button:
      'rounded-full bg-white px-8 py-3 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-teal-50',
  },
  brand: {
    section: 'bg-brand',
    heading: 'text-white',
    subtitle: 'text-teal-50',
    button:
      'rounded-full bg-white px-8 py-3 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-teal-50',
  },
  light: {
    section: 'bg-slate-50 border-y border-slate-200',
    heading: 'text-ink',
    subtitle: 'text-muted',
    button:
      'rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark',
  },
};

export default function CTABannerBlock({
  locale,
  heading,
  subtitle,
  buttonLabel,
  buttonHref,
  variant,
}: CTABannerBlockProps) {
  const styles = variantStyles[variant] || variantStyles.dark;

  return (
    <section className={styles.section}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row">
        <div>
          <h2 className={`text-2xl font-bold ${styles.heading}`}>
            {t(heading, locale)}
          </h2>
          <p className={`mt-2 ${styles.subtitle}`}>
            {t(subtitle, locale)}
          </p>
        </div>
        <Link href={buttonHref} className={styles.button}>
          {t(buttonLabel, locale)}
        </Link>
      </div>
    </section>
  );
}
