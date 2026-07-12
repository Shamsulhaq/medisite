"use client";

// -----------------------------------------------------------------------------
// Shared pagination control for admin list views. URL-driven: clicking a page
// updates the `page` query param while preserving all other filters, so it
// works with server-side paginated pages.
// -----------------------------------------------------------------------------

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  /** The query-param name to control (defaults to "page"). */
  param?: string;
}

export default function Pagination({
  page,
  totalPages,
  total,
  perPage,
  param = "page",
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(param, String(p));
    return `${pathname}?${params.toString()}`;
  };

  // Windowed page numbers around the current page.
  const windowSize = 2;
  const pages: number[] = [];
  const start = Math.max(1, page - windowSize);
  const end = Math.min(totalPages, page + windowSize);
  for (let p = start; p <= end; p++) pages.push(p);

  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  const linkBase =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm transition";
  const inactive = "border-slate-300 text-ink hover:border-brand hover:text-brand";
  const active = "border-brand bg-brand text-white";
  const disabled = "pointer-events-none border-slate-200 text-slate-300";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted">
        {total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}
      </p>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1.5" aria-label="Pagination">
          <Link
            href={hrefFor(Math.max(1, page - 1))}
            aria-label="Previous page"
            className={`${linkBase} ${page <= 1 ? disabled : inactive}`}
            aria-disabled={page <= 1}
          >
            ‹
          </Link>

          {start > 1 && (
            <>
              <Link href={hrefFor(1)} className={`${linkBase} ${inactive}`}>
                1
              </Link>
              {start > 2 && <span className="px-1 text-muted">…</span>}
            </>
          )}

          {pages.map((p) => (
            <Link
              key={p}
              href={hrefFor(p)}
              aria-current={p === page ? "page" : undefined}
              className={`${linkBase} ${p === page ? active : inactive}`}
            >
              {p}
            </Link>
          ))}

          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="px-1 text-muted">…</span>}
              <Link href={hrefFor(totalPages)} className={`${linkBase} ${inactive}`}>
                {totalPages}
              </Link>
            </>
          )}

          <Link
            href={hrefFor(Math.min(totalPages, page + 1))}
            aria-label="Next page"
            className={`${linkBase} ${page >= totalPages ? disabled : inactive}`}
            aria-disabled={page >= totalPages}
          >
            ›
          </Link>
        </nav>
      )}
    </div>
  );
}
