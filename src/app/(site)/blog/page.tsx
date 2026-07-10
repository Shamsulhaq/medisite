import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts, getSettings } from "@/lib/store";
import { t, UI } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const locale = await getLocale(s.defaultLanguage);
  return {
    title: t(UI.blogHeading, locale),
    description: t(UI.blogIntro, locale),
  };
}

export default async function BlogPage() {
  const settings = await getSettings();
  const locale = await getLocale(settings.defaultLanguage);
  const posts = await getPublishedPosts();

  return (
    <>
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            {t(settings.menu.find((m) => m.href === "/blog")?.label ?? UI.blogHeading, locale)}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">
            {t(UI.blogHeading, locale)}
          </h1>
          <p className="mt-3 max-w-2xl text-muted">{t(UI.blogIntro, locale)}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-muted">
            {t(UI.noArticles, locale)}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-brand hover:shadow-md"
              >
                {post.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImage}
                    alt=""
                    className="h-44 w-full object-cover"
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
                  <h2 className="mt-3 text-lg font-semibold text-ink">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="transition hover:text-brand"
                    >
                      {t(post.title, locale)}
                    </Link>
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {t(post.excerpt, locale)}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-muted">
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      · {post.readingMinutes} {t(UI.minRead, locale)}
                    </p>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-sm font-semibold text-brand hover:text-brand-dark"
                    >
                      {t(UI.read, locale)}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
