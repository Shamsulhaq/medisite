import Link from 'next/link';
import { t, type LocalizedString } from '@/lib/i18n';

type HeroBlockProps = {
  locale: 'en' | 'bn';
  badge: LocalizedString;
  heading: LocalizedString;
  subtext: LocalizedString;
  ctaPrimaryLabel: LocalizedString;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: LocalizedString;
  ctaSecondaryHref: string;
  showPhoto: boolean;
  context: { doctorName: string; doctorPhoto?: string; doctorInitials: string };
};

export default function HeroBlock({
  locale,
  badge,
  heading,
  subtext,
  ctaPrimaryLabel,
  ctaPrimaryHref,
  ctaSecondaryLabel,
  ctaSecondaryHref,
  showPhoto,
  context,
}: HeroBlockProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-teal-500 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            {t(badge, locale)}
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            {t(heading, locale)}
          </h1>
          <p className="mt-4 max-w-xl text-base text-teal-50 sm:text-lg">
            {t(subtext, locale)}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={ctaPrimaryHref}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-teal-50"
            >
              {t(ctaPrimaryLabel, locale)}
            </Link>
            <Link
              href={ctaSecondaryHref}
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {t(ctaSecondaryLabel, locale)}
            </Link>
          </div>
        </div>

        {showPhoto && (
          <div className="flex justify-center md:justify-end">
            {context.doctorPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={context.doctorPhoto}
                alt={context.doctorName}
                className="h-56 w-56 rounded-2xl object-cover ring-1 ring-white/30 sm:h-72 sm:w-72"
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/30 backdrop-blur sm:h-72 sm:w-72">
                <div className="text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/20">
                    <span className="text-4xl font-bold">
                      {context.doctorInitials}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
