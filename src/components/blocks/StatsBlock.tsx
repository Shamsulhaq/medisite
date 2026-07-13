import { t, type LocalizedString } from '@/lib/i18n';

type StatsBlockProps = {
  locale: 'en' | 'bn';
  items: Array<{ value: string; label: LocalizedString }>;
};

export default function StatsBlock({ locale, items }: StatsBlockProps) {
  if (items.length === 0) return null;

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
        {items.map((item, i) => (
          <div key={i} className="text-center">
            <p className="text-2xl font-bold text-brand sm:text-3xl">
              {item.value}
            </p>
            <p className="mt-1 text-sm text-muted">
              {t(item.label, locale)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
