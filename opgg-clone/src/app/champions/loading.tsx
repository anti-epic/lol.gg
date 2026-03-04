export default function ChampionsLoading() {
  return (
    <div
      className="mx-auto max-w-7xl animate-pulse space-y-6 p-6"
      aria-label="Loading champions"
      aria-busy="true"
    >
      <div className="space-y-2">
        <div className="h-9 w-40 rounded bg-muted" />
        <div className="h-4 w-28 rounded bg-muted" />
      </div>

      {/* Search skeleton */}
      <div className="h-10 w-full rounded-lg bg-muted" />

      {/* Grid skeleton */}
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3"
          >
            <div className="h-14 w-14 rounded bg-muted" />
            <div className="h-3 w-12 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
