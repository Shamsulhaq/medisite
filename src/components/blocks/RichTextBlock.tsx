import { t, type LocalizedString } from '@/lib/i18n';
import Markdown from '@/components/Markdown';

type RichTextBlockProps = {
  locale: 'en' | 'bn';
  content: LocalizedString;
};

export default function RichTextBlock({ locale, content }: RichTextBlockProps) {
  const resolved = t(content, locale);
  if (!resolved) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Markdown
          content={resolved}
          className="text-base leading-relaxed text-muted"
        />
      </div>
    </section>
  );
}
