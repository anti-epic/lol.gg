import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Champion Tier List — OP.GG Clone",
  description: "League of Legends champion win rates, pick rates, and tier rankings",
};

// ISR — revalidate every hour (per architecture.md)
export const revalidate = 3600;

export default function ChampionsPage() {
  // TODO (Step 7): Fetch champion aggregate stats via tRPC server caller
  // const champions = await caller.champions.getTierList()

  return (
    <main id="main-content" className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Champion Tier List</h1>
        <p className="mt-1 text-muted-foreground">
          Win rates, pick rates, and ban rates aggregated across all ranked games
        </p>
      </div>

      {/* TODO: Role filter tabs */}
      {/* TODO: Tier list table — champion icon, name, tier, win rate, pick rate, ban rate */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-muted-foreground">Champion tier list data will appear here.</p>
      </div>
    </main>
  );
}
