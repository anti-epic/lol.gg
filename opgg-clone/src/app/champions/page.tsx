import { type Metadata } from "next";
import { getAllChampions, getDDragonVersion } from "@/lib/ddragon";
import { ChampionGrid } from "@/components/champion-grid";

export const metadata: Metadata = {
  title: "Champions — lol.gg",
  description: "Browse all League of Legends champions",
};

export const revalidate = 3600;

export default async function ChampionsPage() {
  const [championsMap, version] = await Promise.all([getAllChampions(), getDDragonVersion()]);

  const champions = Object.values(championsMap).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main id="main-content" className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Champions</h1>
        <p className="mt-1 text-muted-foreground">{champions.length} champions</p>
      </div>

      <ChampionGrid champions={champions} version={version} />
    </main>
  );
}
