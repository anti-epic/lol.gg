import type { Metadata } from "next";
import Image from "next/image";
import {
  getAllChampions,
  getChampionDetail,
  getDDragonVersion,
  championLoadingUrl,
  spellIconUrl,
  passiveIconUrl,
  itemIconUrl,
} from "@/lib/ddragon";
import { db } from "@/server/services/db";
import { extractPatch } from "@/lib/build-aggregator";

export const revalidate = 3600;

export async function generateStaticParams() {
  const champions = await getAllChampions();
  return Object.keys(champions).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const champion = await getChampionDetail(id);
  return {
    title: `${champion.name} — ${champion.title} | lol.gg`,
    description: champion.blurb,
  };
}

const SPELL_KEYS = ["Q", "W", "E", "R"] as const;
const SPELL_KEY_COLORS: Record<string, string> = {
  Q: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  W: "bg-teal-500/20 text-teal-400 border border-teal-500/30",
  E: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  R: "bg-red-500/20 text-red-400 border border-red-500/30",
  P: "bg-muted text-muted-foreground border border-border",
};

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  mp: "Mana",
  armor: "Armor",
  spellblock: "Magic Resist",
  attackdamage: "Attack Damage",
  attackspeed: "Attack Speed",
  movespeed: "Move Speed",
  attackrange: "Range",
};

export default async function ChampionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [champion, version] = await Promise.all([getChampionDetail(id), getDDragonVersion()]);

  const patch = extractPatch(version);
  const championId = parseInt(champion.key, 10);

  // DB queries are best-effort: during builds (11 parallel workers) or when the
  // DB is unavailable they fail gracefully and the placeholder is shown instead.
  const MIN_GAMES = 3;
  let buildItems: { itemId: number; wins: number; games: number }[] = [];
  let overallWinRate: number | null = null;
  let totalGames = 0;
  let dataPatch = patch; // may fall back to an older patch if current has no data
  try {
    // If the current patch has no data yet, use the most recent patch that does.
    const hasCurrent = await db.championBuildStat.findFirst({
      where: { championId, patch, games: { gte: MIN_GAMES } },
      select: { patch: true },
    });
    if (!hasCurrent) {
      const fallback = await db.championBuildStat.findFirst({
        where: { championId, games: { gte: MIN_GAMES } },
        orderBy: { patch: "desc" },
        select: { patch: true },
      });
      if (fallback) dataPatch = fallback.patch;
    }

    const [rawItems, winStats] = await Promise.all([
      db.championBuildStat.findMany({
        where: { championId, patch: dataPatch, games: { gte: MIN_GAMES } },
        orderBy: { games: "desc" },
        take: 10,
      }),
      db.championWinStat.findMany({ where: { championId, patch: dataPatch } }),
    ]);
    buildItems = rawItems;
    totalGames = winStats.reduce((sum, s) => sum + s.games, 0);
    const totalWins = winStats.reduce((sum, s) => sum + s.wins, 0);
    overallWinRate = totalGames > 0 ? totalWins / totalGames : null;
  } catch {
    // DB unavailable or too many connections — render placeholder
  }

  return (
    <main id="main-content" className="mx-auto max-w-5xl space-y-8 p-6">
      {/* ── Header ── */}
      <section className="flex flex-col gap-6 sm:flex-row">
        <Image
          src={championLoadingUrl(champion.id)}
          alt={`${champion.name} loading art`}
          width={374}
          height={448}
          className="w-full max-w-[187px] rounded-xl object-cover sm:w-auto"
          priority
        />
        <div className="flex flex-col justify-center gap-3">
          <div>
            <h1 className="text-4xl font-bold text-foreground">{champion.name}</h1>
            <p className="text-lg text-muted-foreground">{champion.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {champion.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="max-w-prose text-sm text-muted-foreground">{champion.blurb}</p>
        </div>
      </section>

      {/* ── Abilities ── */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Abilities</h2>
        <div className="space-y-3">
          {/* Passive */}
          <div className="flex gap-4 rounded-xl border border-border bg-card p-4">
            <div className="relative shrink-0">
              <Image
                src={passiveIconUrl(version, champion.passive.image.full)}
                alt={champion.passive.name}
                width={48}
                height={48}
                className="rounded"
              />
              <span
                className={`absolute -bottom-1.5 -right-1.5 rounded px-1 py-0.5 text-[10px] font-bold leading-none ${SPELL_KEY_COLORS.P}`}
              >
                P
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{champion.passive.name}</p>
              <p
                className="mt-1 text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: champion.passive.description }}
              />
            </div>
          </div>

          {/* Q/W/E/R */}
          {champion.spells.map((spell, i) => {
            const key = SPELL_KEYS[i] ?? "?";
            const keyColor = SPELL_KEY_COLORS[key] ?? SPELL_KEY_COLORS.P;
            return (
              <div
                key={spell.id}
                className="flex gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className="relative shrink-0">
                  <Image
                    src={spellIconUrl(version, spell.image.full)}
                    alt={spell.name}
                    width={48}
                    height={48}
                    className="rounded"
                  />
                  <span
                    className={`absolute -bottom-1.5 -right-1.5 rounded px-1 py-0.5 text-[10px] font-bold leading-none ${keyColor}`}
                  >
                    {key}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{spell.name}</p>
                  <p
                    className="mt-1 text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: spell.description }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Base Stats ── */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Base Stats</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(STAT_LABELS) as Array<keyof typeof champion.stats>).map((key) => (
            <div key={key} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{STAT_LABELS[key]}</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {key === "attackspeed" ? champion.stats[key].toFixed(3) : champion.stats[key]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Popular Items ── */}
      <section>
        <div className="mb-4 flex items-baseline gap-3">
          <h2 className="text-xl font-semibold text-foreground">Popular Items</h2>
          {overallWinRate !== null && (
            <span className="text-sm text-muted-foreground">
              {(overallWinRate * 100).toFixed(1)}% win rate · {totalGames.toLocaleString()} games
              (patch {dataPatch})
            </span>
          )}
        </div>

        {buildItems.length > 0 ? (
          <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
            {buildItems.map((item) => {
              const wr = item.wins / item.games;
              const wrColor =
                wr > 0.52 ? "text-green-400" : wr < 0.48 ? "text-red-400" : "text-muted-foreground";
              return (
                <div key={item.itemId} className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <Image
                      src={itemIconUrl(version, String(item.itemId))}
                      alt={`Item ${item.itemId}`}
                      width={40}
                      height={40}
                      className="rounded border border-border"
                    />
                  </div>
                  <span className={`text-[10px] font-semibold leading-none ${wrColor}`}>
                    {(wr * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] leading-none text-muted-foreground">
                    {item.games >= 1000 ? `${(item.games / 1000).toFixed(1)}k` : item.games}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Data is being collected — check back soon after more matches are processed.
          </div>
        )}
      </section>
    </main>
  );
}
