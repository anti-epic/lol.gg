export default function SummonerLoading() {
  return (
    <div
      className="mx-auto max-w-5xl animate-pulse space-y-6 p-6"
      aria-label="Loading summoner profile"
      aria-busy="true"
    >
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
        </div>
      </div>

      {/* Rank cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-28 rounded-xl bg-muted" />
        <div className="h-28 rounded-xl bg-muted" />
      </div>

      {/* Match history skeleton */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="h-6 w-32 rounded bg-muted" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
