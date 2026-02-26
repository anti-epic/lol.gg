export default function ChampionsLoading() {
  return (
    <div
      className="mx-auto max-w-5xl animate-pulse space-y-6 p-6"
      aria-label="Loading champion tier list"
      aria-busy="true"
    >
      <div className="space-y-2">
        <div className="h-9 w-56 rounded bg-muted" />
        <div className="h-4 w-96 rounded bg-muted" />
      </div>

      {/* Table skeleton */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <div className="h-10 rounded bg-muted" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
