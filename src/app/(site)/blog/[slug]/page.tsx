import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedPosts, getSettings } from "@/lib/store";
import { t, UI } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import Icon from "@/components/Icon";
import Markdown from "@/components/Markdown";
import ViewCounter from "@/components/ViewCounter";
import SocialShare from "@/components/SocialShare";

export const dynamic = "force-dynamic";

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

  const title = post.metaTitle || t(post.title, locale);
  const description = post.metaDescription || t(post.excerpt, locale);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(post.ogImage ? { images: [{ url: post.ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(post.ogImage ? { images: [post.ogImage] } : {}),
    },
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

  // Get related posts (same category or matching tags)
  const allPosts = await getPublishedPosts();
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug)
    .filter(
      (p) =>
        (post.category && p.category === post.category) ||
        p.tags.some((tag) => post.tags.includes(tag))
    )
    .slice(0, 3);

  // Determine disclaimer
  const disclaimerText =
    post.disclaimer || settings.blog?.defaultDisclaimer || "";

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <ViewCounter slug={slug} />

      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
      >
        {t(UI.backToArticles, locale)}
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap gap-2">
          {post.category && (
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
              {post.category}
            </span>
          )}
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

        {/* Social Sharing */}
        <SocialShare title={t(post.title, locale)} />
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

      {/* References */}
      {post.references && (
        <div className="mt-10 border-t border-slate-200 pt-6">
          <h3 className="text-lg font-bold text-ink">References</h3>
          <div className="mt-3 text-sm text-slate-600">
            <Markdown content={post.references} className="text-sm" />
          </div>
        </div>
      )}

      {/* Medically Reviewed By */}
      {post.reviewedBy && (
        <div className="mt-8 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-green-800">
              Medically reviewed by {post.reviewedBy}
            </p>
            {post.reviewedDate && (
              <p className="text-xs text-green-600">
                Reviewed on{" "}
                {new Date(post.reviewedDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Medical Disclaimer */}
      {disclaimerText && (
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Medical Disclaimer
          </p>
          <p className="mt-1 text-sm text-amber-800">{disclaimerText}</p>
        </div>
      )}

      {/* CTA */}
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

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="mt-12 border-t border-slate-200 pt-8">
          <h3 className="text-lg font-bold text-ink">Related Articles</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((rp) => (
              <Link
                key={rp.slug}
                href={`/blog/${rp.slug}`}
                className="block rounded-lg border border-slate-200 p-4 transition hover:border-brand hover:shadow-sm"
              >
                <h4 className="font-medium text-ink line-clamp-2">
                  {t(rp.title, locale)}
                </h4>
                <p className="mt-1 text-xs text-muted">
                  {new Date(rp.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
