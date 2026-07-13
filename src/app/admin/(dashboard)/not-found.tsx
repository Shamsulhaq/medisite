import Link from 'next/link';

/**
 * Admin Not Found Page
 * Displayed when a route within the admin dashboard is not found.
 */
export default function AdminNotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
        {/* 404 indicator */}
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100"
          aria-hidden="true"
        >
          <svg
            className="h-6 w-6 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-lg font-semibold text-slate-800">
          Page Not Found
        </h1>

        <p className="mb-6 text-sm text-slate-500">
          The admin page you are looking for does not exist or has been removed.
        </p>

        <Link
          href="/admin"
          className="inline-block rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
