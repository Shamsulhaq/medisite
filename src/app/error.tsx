'use client';

/**
 * App Error Boundary
 * Catches errors in route segments under the root layout.
 * Tailwind classes are available since the root layout is still rendered.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
        {/* Error icon */}
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl"
          aria-hidden="true"
        >
          ⚠️
        </div>

        <h1 className="mb-2 text-xl font-semibold text-slate-800">
          Something went wrong
        </h1>

        <p className="mb-6 text-sm text-slate-500">
          An unexpected error occurred while loading this page. Please try again.
        </p>

        <button
          onClick={() => reset()}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
