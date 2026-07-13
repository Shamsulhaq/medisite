import { t, type LocalizedString } from '@/lib/i18n';
import Icon from '@/components/Icon';

type FeatureGridBlockProps = {
  locale: 'en' | 'bn';
  heading: LocalizedString;
  subtitle: LocalizedString;
  items: Array<{ icon: string; title: LocalizedString; description: LocalizedString }>;
};

export default function FeatureGridBlock({
  locale,
  heading,
  subtitle,
  items,
}: FeatureGridBlockProps) {
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">
          {t(heading, locale)}
        </h2>
        <p className="mt-3 text-muted">{t(subtitle, locale)}</p>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-brand hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
              <Icon name={item.icon} />
            </div>
            <h3 className="mt-4 font-semibold text-ink">
              {t(item.title, locale)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {t(item.description, locale)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
