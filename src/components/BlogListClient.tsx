"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type PostItem = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingMinutes: number;
  tags: string[];
  coverImage: string;
  category: string;
};

export default function BlogListClient({
  posts,
  categories,
  minReadLabel,
  readLabel,
  noArticlesLabel,
}: {
  posts: PostItem[];
  categories: string[];
  minReadLabel: string;
  readLabel: string;
  noArticlesLabel: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const filteredPosts = useMemo(() => {
    let result = posts;

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return result;
  }, [posts, search, selectedCategory]);

  // Get unique categories that exist in posts
  const allCategories = useMemo(() => {
    const fromPosts = [...new Set(posts.map((p) => p.category).filter(Boolean))];
    const merged = [...new Set([...categories, ...fromPosts])];
    return merged.filter(Boolean);
  }, [posts, categories]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      {/* Search & Filter */}
      <div className="mb-8 space-y-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 sm:max-w-md"
        />

        {allCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                selectedCategory === ""
                  ? "bg-brand text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  selectedCategory === cat
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-muted">
          {search || selectedCategory ? "No matching articles found." : noArticlesLabel}
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
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
                <h2 className="mt-3 text-lg font-semibold text-ink">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="transition hover:text-brand"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-muted">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    · {post.readingMinutes} {minReadLabel}
                  </p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-sm font-semibold text-brand hover:text-brand-dark"
                  >
                    {readLabel}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
