import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getSettings } from "@/lib/store";
import { t, UI } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import Icon from "@/components/Icon";
import Markdown from "@/components/Markdown";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  const s = await getSettings();
  const locale = await getLocale(s.defaultLanguage);
  return {
    title: t(post.title, locale),
    description: t(post.excerpt, locale),
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || !post.published) {
    notFound();
  }

  const settings = await getSettings();
  const locale = await getLocale(settings.defaultLanguage);
  const name = t(settings.doctor.name, locale);

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
      >
        {t(UI.backToArticles, locale)}
      </Link>

      <header className="mt-6">
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
        <h1 className="mt-4 text-3xl font-bold leading-tight text-ink sm:text-4xl">
          {t(post.title, locale)}
        </h1>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <Icon name="calendar" className="h-4 w-4" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="clock" className="h-4 w-4" />
            {post.readingMinutes} {t(UI.minRead, locale)}
          </span>
        </div>
        <p className="mt-3 text-sm text-muted">
          {t(UI.by, locale)} {name}
        </p>
      </header>

      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage}
          alt=""
          className="mt-6 w-full rounded-xl object-cover ring-1 ring-slate-200"
        />
      )}

      <Markdown
        content={t(post.body, locale)}
        className="mt-8 text-[17px] text-slate-700"
      />

      <div className="mt-12 rounded-xl bg-slate-50 p-6 text-center ring-1 ring-slate-200">
        <p className="font-semibold text-ink">
          {t(settings.doctor.tagline, locale)}
        </p>
        <Link
          href="/appointment"
          className="mt-4 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          {t(UI.bookAppointment, locale)}
        </Link>
      </div>
    </article>
  );
}
