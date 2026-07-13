import Link from 'next/link';
import { t, UI, type LocalizedString } from '@/lib/i18n';
import { getPublishedPosts } from '@/lib/store';

type BlogPreviewBlockProps = {
  locale: 'en' | 'bn';
  heading: LocalizedString;
  subtitle: LocalizedString;
  count: number;
};

export default async function BlogPreviewBlock({
  locale,
  heading,
  subtitle,
  count,
}: BlogPreviewBlockProps) {
  const posts = (await getPublishedPosts()).slice(0, count);

  if (posts.length === 0) return null;

  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              {t(heading, locale)}
            </h2>
            <p className="mt-2 text-muted">{t(subtitle, locale)}</p>
          </div>
          <Link
            href="/blog"
            className="hidden text-sm font-semibold text-brand hover:text-brand-dark sm:inline"
          >
            {t(UI.viewAll, locale)}
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-brand hover:shadow-md"
            >
              {post.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.coverImage}
                  alt=""
                  className="h-40 w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand-dark"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="mt-3 font-semibold text-ink group-hover:text-brand">
                  {t(post.title, locale)}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted">
                  {t(post.excerpt, locale)}
                </p>
                <p className="mt-4 text-xs text-muted">
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  · {post.readingMinutes} {t(UI.minRead, locale)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
