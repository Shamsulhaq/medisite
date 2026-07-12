import type { Metadata } from "next";
import { getPublishedPosts, getSettings } from "@/lib/store";
import { t, UI } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import BlogListClient from "@/components/BlogListClient";

export const dynamic = "force-dynamic";

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

  // Serialize posts for client component
  const serializedPosts = posts.map((p) => ({
    slug: p.slug,
    title: t(p.title, locale),
    excerpt: t(p.excerpt, locale),
    date: p.date,
    readingMinutes: p.readingMinutes,
    tags: p.tags,
    coverImage: p.coverImage ?? "",
    category: p.category,
  }));

  const categories = settings.blog?.categories ?? [];
  const blogHeading = t(UI.blogHeading, locale);
  const blogIntro = t(UI.blogIntro, locale);
  const menuLabel = t(settings.menu.find((m) => m.href === "/blog")?.label ?? UI.blogHeading, locale);
  const minReadLabel = t(UI.minRead, locale);
  const readLabel = t(UI.read, locale);
  const noArticlesLabel = t(UI.noArticles, locale);

  return (
    <>
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            {menuLabel}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">
            {blogHeading}
          </h1>
          <p className="mt-3 max-w-2xl text-muted">{blogIntro}</p>
        </div>
      </section>

      <BlogListClient
        posts={serializedPosts}
        categories={categories}
        minReadLabel={minReadLabel}
        readLabel={readLabel}
        noArticlesLabel={noArticlesLabel}
      />
    </>
  );
}
