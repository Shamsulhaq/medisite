import Link from "next/link";
import { getSettings, getPublishedPosts } from "@/lib/store";
import { t, UI } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import Icon from "@/components/Icon";

export default async function HomePage() {
  const settings = await getSettings();
  const locale = await getLocale(settings.defaultLanguage);
  const posts = (await getPublishedPosts()).slice(0, 3);
  const { doctor, stats, specialties, home } = settings;

  const name = t(doctor.name, locale);
  const initials =
    doctor.initials?.trim() ||
    name
      .replace(/^Dr\.?\s*|^ডা\.?\s*/i, "")
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-teal-500 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              {t(home.heroBadge, locale)}
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              {name}
            </h1>
            <p className="mt-4 max-w-xl text-base text-teal-50 sm:text-lg">
              {t(doctor.intro, locale)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/appointment"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-teal-50"
              >
                {t(home.ctaPrimaryLabel, locale)}
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t(home.ctaSecondaryLabel, locale)}
              </Link>
            </div>
          </div>

          {/* Portrait */}
          <div className="flex justify-center md:justify-end">
            {doctor.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doctor.photo}
                alt={name}
                className="h-56 w-56 rounded-2xl object-cover ring-1 ring-white/30 sm:h-72 sm:w-72"
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/30 backdrop-blur sm:h-72 sm:w-72">
                <div className="text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/20">
                    <span className="text-4xl font-bold">{initials}</span>
                  </div>
                  <p className="mt-3 px-4 text-xs text-teal-50">
                    Upload a photo in Admin → Settings
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats.length > 0 && (
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-bold text-brand sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-muted">{t(s.label, locale)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Specialties */}
      {specialties.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              {t(home.areasHeading, locale)}
            </h2>
            <p className="mt-3 text-muted">{t(home.areasSubtitle, locale)}</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {specialties.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-brand hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                  <Icon name={s.icon} />
                </div>
                <h3 className="mt-4 font-semibold text-ink">
                  {t(s.title, locale)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {t(s.description, locale)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latest blog */}
      {posts.length > 0 && (
        <section className="bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-ink sm:text-3xl">
                  {t(home.latestHeading, locale)}
                </h2>
                <p className="mt-2 text-muted">
                  {t(home.latestSubtitle, locale)}
                </p>
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
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      · {post.readingMinutes} {t(UI.minRead, locale)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-brand-dark">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {t(home.bottomCtaHeading, locale)}
            </h2>
            <p className="mt-2 text-teal-100">
              {t(home.bottomCtaSubtitle, locale)}
            </p>
          </div>
          <Link
            href="/appointment"
            className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-teal-50"
          >
            {t(home.ctaPrimaryLabel, locale)}
          </Link>
        </div>
      </section>
    </>
  );
}
