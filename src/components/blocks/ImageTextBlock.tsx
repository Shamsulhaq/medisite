import { t, type Locale, type LocalizedString } from '@/lib/i18n';

type Props = {
  locale: Locale;
  image: string;
  heading: LocalizedString;
  text: LocalizedString;
  imagePosition: 'left' | 'right';
};

/**
 * ImageTextBlock — renders an image on one side with heading + text on the other.
 * Supports left/right image positioning.
 */
export default function ImageTextBlock({
  locale,
  image,
  heading,
  text,
  imagePosition,
}: Props) {
  const headingText = t(heading, locale);
  const bodyText = t(text, locale);

  const imageEl = image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={headingText || ''}
      className="h-auto w-full rounded-2xl object-cover"
    />
  ) : null;

  const textEl = (
    <div className="flex flex-col justify-center">
      {headingText && (
        <h2 className="text-2xl font-bold text-ink">{headingText}</h2>
      )}
      {bodyText && (
        <div className="prose-content mt-4 text-muted">
          {bodyText.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid items-center gap-8 md:grid-cols-2">
        {imagePosition === 'left' ? (
          <>
            <div>{imageEl}</div>
            {textEl}
          </>
        ) : (
          <>
            {textEl}
            <div>{imageEl}</div>
          </>
        )}
      </div>
    </section>
  );
}
