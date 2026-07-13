'use client';

import Link from 'next/link';

/**
 * Admin Dashboard Error Boundary
 * Catches errors within the admin dashboard route group.
 * Uses red accent styling to indicate an error state.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-xl border border-red-100 bg-white p-8 text-center shadow-sm">
        {/* Error icon */}
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50"
          aria-hidden="true"
        >
          <svg
            className="h-6 w-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-lg font-semibold text-red-700">
          Admin Error
        </h1>

        <p className="mb-1 text-sm text-slate-600">
          Something went wrong while loading this section.
        </p>

        {error.message && (
          <p className="mb-4 text-xs text-slate-400">
            {error.message}
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try Again
          </button>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
