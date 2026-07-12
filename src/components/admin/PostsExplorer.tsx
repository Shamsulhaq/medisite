"use client";

// -----------------------------------------------------------------------------
// Admin blog-posts list — URL-driven filters + server-side pagination.
// Mirrors PatientsExplorer: filters are pushed to the URL via router.replace
// (preserving other params), a filter change resets to page 1, and the shared
// <Pagination/> control drives the `page` param against server-paginated data.
// Preserves the original table columns (Title, Category, Date, Views, Status)
// and row actions (View / Edit / Delete).
// -----------------------------------------------------------------------------

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { BlogPost } from "@/lib/types";
import { t } from "@/lib/i18n";
import AdminIcon from "@/components/admin/AdminIcon";
import Pagination from "@/components/admin/Pagination";
import DeletePostButton from "@/components/admin/DeletePostButton";
import { Badge } from "@/components/admin/ui";

const control =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

interface Filters {
  q: string;
  status: string;
}

export default function PostsExplorer({
  items,
  total,
  page,
  perPage,
  totalPages,
  filters,
}: {
  items: BlogPost[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  filters: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local text-search state so typing is smooth; other filters apply on change.
  const [search, setSearch] = useState(filters.q);
  useEffect(() => setSearch(filters.q), [filters.q]);

  // Push updated filters to the URL. Resets to page 1 whenever a filter
  // changes (page is only preserved by the Pagination control itself).
  const applyFilters = (patch: Partial<Filters>) => {
    const params = new URLSearchParams(searchParams.toString());
    const next: Filters = { ...filters, ...patch };
    const setOrDelete = (key: keyof Filters, val: string, def: string) => {
      if (val && val !== def) params.set(key, val);
      else params.delete(key);
    };
    setOrDelete("q", next.q, "");
    setOrDelete("status", next.status, "all");
    params.delete("page"); // any filter change returns to the first page
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  // Debounce the free-text search box.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyFilters({ q: value }), 350);
  };

  const noFilters = !filters.q && filters.status === "all";

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[200px] flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-muted">Search</span>
            <input
              type="text"
              // NOTE: title is a Json column, so server-side search matches the
              // slug + category string columns only (not the localized title).
              placeholder="Slug or category..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className={control}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Status</span>
            <select
              value={filters.status}
              onChange={(e) => applyFilters({ status: e.target.value })}
              className={control}
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
          <span className="ml-auto self-end text-xs text-muted">
            {isPending ? "Loading…" : `${total} result${total === 1 ? "" : "s"}`}
          </span>
        </div>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          {noFilters ? (
            <>
              <p className="text-sm text-muted">
                No posts yet. Create your first article.
              </p>
              <Link
                href="/admin/posts/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                <AdminIcon name="plus" className="h-4 w-4" />
                New Post
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted">No posts match your filters.</p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Views</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((post) => (
                  <tr key={post.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">{t(post.title, "en")}</p>
                      <p className="text-xs text-muted">/{post.slug}</p>
                    </td>
                    <td className="px-5 py-3 text-muted">{post.category || "—"}</td>
                    <td className="px-5 py-3 text-muted">{post.date}</td>
                    <td className="px-5 py-3 text-muted">{post.viewCount}</td>
                    <td className="px-5 py-3">
                      <Badge tone={post.published ? "green" : post.scheduledDate ? "blue" : "slate"}>
                        {post.published ? "Published" : post.scheduledDate ? "Scheduled" : "Draft"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-4">
                        {post.published && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="text-sm font-medium text-muted hover:text-brand"
                          >
                            View
                          </Link>
                        )}
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="text-sm font-medium text-brand hover:text-brand-dark"
                        >
                          Edit
                        </Link>
                        <DeletePostButton id={post.id} title={t(post.title, "en")} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} perPage={perPage} />
    </div>
  );
}
