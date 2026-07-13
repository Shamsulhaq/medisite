/**
 * Admin Dashboard Loading Skeleton
 * Displays placeholder cards with pulse animation while dashboard content loads.
 * Matches the dashboard layout: 4 stat cards + content area.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      {/* Stat cards skeleton — 4 cards in a responsive grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <div className="animate-pulse space-y-3">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="h-7 w-16 rounded bg-slate-200" />
              <div className="h-2 w-24 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Main content area skeleton */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="h-8 w-24 rounded-lg bg-slate-100" />
          </div>

          {/* Table/list rows */}
          <div className="space-y-3 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-slate-200" />
                  <div className="h-2 w-1/2 rounded bg-slate-100" />
                </div>
                <div className="h-6 w-16 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
