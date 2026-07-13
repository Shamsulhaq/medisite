import Link from 'next/link';

/**
 * Not Found Page (404)
 * Displayed when no route matches or notFound() is called.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
        {/* 404 indicator */}
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl"
          aria-hidden="true"
        >
          🔍
        </div>

        <h1 className="mb-2 text-xl font-semibold text-slate-800">
          Page Not Found
        </h1>

        <p className="mb-6 text-sm text-slate-500">
          The page you are looking for does not exist or has been moved.
        </p>

        <Link
          href="/"
          className="inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
