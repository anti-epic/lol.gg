import { type Metadata } from "next";

// SSR — data is dynamic and needs to be fresh on every load (per architecture.md)
interface PageProps {
  params: Promise<{ region: string; name: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { region, name } = await params;
  const displayName = decodeURIComponent(name);
  return {
    title: `${displayName} (${region.toUpperCase()}) — OP.GG Clone`,
    description: `League of Legends stats, rank, and match history for ${displayName} in ${region.toUpperCase()}`,
  };
}

export default async function SummonerPage({ params }: PageProps) {
  const { region, name } = await params;
  const displayName = decodeURIComponent(name);

  // TODO (Step 7): Fetch summoner data via tRPC server-side caller
  // const caller = createCaller(createContext())
  // const summoner = await caller.summoner.getProfile({ name, region })

  return (
    <main id="main-content" className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {/* TODO: Champion icon / profile icon */}
        <div className="h-20 w-20 rounded-full bg-muted" aria-hidden="true" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
          <p className="text-sm text-muted-foreground">{region.toUpperCase()}</p>
        </div>
      </div>

      {/* Rank cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* TODO: Ranked Solo/Duo card */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ranked Solo / Duo
          </p>
          <p className="mt-2 text-muted-foreground">Loading rank data...</p>
        </div>
        {/* TODO: Ranked Flex card */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ranked Flex
          </p>
          <p className="mt-2 text-muted-foreground">Loading rank data...</p>
        </div>
      </div>

      {/* Match history */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Match History</h2>
        {/* TODO: Match history list component */}
        <p className="text-muted-foreground">Match history will appear here.</p>
      </div>

      {/* Champion stats */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Champion Stats</h2>
        {/* TODO: Champion stats table component */}
        <p className="text-muted-foreground">Champion stats will appear here.</p>
      </div>
    </main>
  );
}
