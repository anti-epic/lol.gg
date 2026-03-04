export default function ChampionDetailLoading() {
  return (
    <div
      className="mx-auto max-w-5xl animate-pulse space-y-8 p-6"
      aria-label="Loading champion details"
      aria-busy="true"
    >
      {/* Header skeleton */}
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="h-[224px] w-[187px] shrink-0 rounded-xl bg-muted" />
        <div className="flex flex-col justify-center gap-3">
          <div className="space-y-2">
            <div className="h-10 w-48 rounded bg-muted" />
            <div className="h-5 w-64 rounded bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-muted" />
            <div className="h-5 w-16 rounded-full bg-muted" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-full max-w-prose rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
          </div>
        </div>
      </div>

      {/* Abilities skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-28 rounded bg-muted" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-xl border border-border bg-card p-4">
            <div className="h-12 w-12 shrink-0 rounded bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-5/6 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Stats skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-24 rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="mt-2 h-6 w-12 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
