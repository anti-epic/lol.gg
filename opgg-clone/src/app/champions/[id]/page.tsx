import type { Metadata } from "next";
import Image from "next/image";
import {
  getAllChampions,
  getChampionDetail,
  getDDragonVersion,
  championLoadingUrl,
  spellIconUrl,
  passiveIconUrl,
  getAramModifiers,
} from "@/lib/ddragon";
import { db } from "@/server/services/db";
import { extractPatch } from "@/lib/build-aggregator";
import { ModeBuildTabs, type ModeData } from "@/components/champions/mode-builds";

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

// Queue IDs we track and the display order
const TRACKED_QUEUES = [420, 450, 1700, 900, 440, 490, 1020, 1300];

export default async function ChampionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [champion, version] = await Promise.all([getChampionDetail(id), getDDragonVersion()]);

  const patch = extractPatch(version);
  const championId = parseInt(champion.key, 10);

  // ---------------------------------------------------------------------------
  // Fetch build data per game mode (best-effort — graceful fallback if DB down)
  // ---------------------------------------------------------------------------

  const modeBuildData: ModeData[] = [];
  let aramModifiers = null;

  try {
    const [winStats, buildStats, aramMods] = await Promise.all([
      db.championWinStat.findMany({
        where: { championId, patch },
        select: { queueId: true, role: true, wins: true, games: true },
      }),
      db.championBuildStat.findMany({
        where: { championId, patch, games: { gte: 3 } },
        orderBy: { games: "desc" },
        select: { queueId: true, role: true, itemId: true, wins: true, games: true },
      }),
      getAramModifiers(),
    ]);

    // Get ARAM modifiers for this champion
    aramModifiers = aramMods[championId] ?? null;

    // Group win stats by queueId
    const winByQueue = new Map<number, { wins: number; games: number; roles: Set<string> }>();
    for (const s of winStats) {
      const entry = winByQueue.get(s.queueId) ?? { wins: 0, games: 0, roles: new Set() };
      entry.wins += s.wins;
      entry.games += s.games;
      if (s.role) entry.roles.add(s.role);
      winByQueue.set(s.queueId, entry);
    }

    // Group build items by queueId (take top 10 per queue by games)
    const itemsByQueue = new Map<number, typeof buildStats>();
    for (const b of buildStats) {
      const arr = itemsByQueue.get(b.queueId) ?? [];
      arr.push(b);
      itemsByQueue.set(b.queueId, arr);
    }

    // Assemble ModeData for each queue that has data
    for (const queueId of TRACKED_QUEUES) {
      const ws = winByQueue.get(queueId);
      if (!ws || ws.games === 0) continue;

      const rawItems = (itemsByQueue.get(queueId) ?? []).slice(0, 10);
      modeBuildData.push({
        queueId,
        totalGames: ws.games,
        winRate: ws.games > 0 ? ws.wins / ws.games : null,
        items: rawItems.map((i) => ({
          itemId: i.itemId,
          winRate: i.games > 0 ? i.wins / i.games : 0,
          games: i.games,
        })),
        roles: [...ws.roles].sort(),
      });
    }

    // Also include any queues with data that aren't in our preset list
    for (const [queueId, ws] of winByQueue.entries()) {
      if (TRACKED_QUEUES.includes(queueId)) continue;
      if (ws.games === 0) continue;
      const rawItems = (itemsByQueue.get(queueId) ?? []).slice(0, 10);
      modeBuildData.push({
        queueId,
        totalGames: ws.games,
        winRate: ws.games > 0 ? ws.wins / ws.games : null,
        items: rawItems.map((i) => ({
          itemId: i.itemId,
          winRate: i.games > 0 ? i.wins / i.games : 0,
          games: i.games,
        })),
        roles: [...ws.roles].sort(),
      });
    }
  } catch {
    // DB unavailable — render without build data
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

      {/* ── Game Mode Builds ── */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Builds by Mode</h2>
        {modeBuildData.length > 0 ? (
          <ModeBuildTabs modes={modeBuildData} version={version} aramModifiers={aramModifiers} />
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Data is being collected — check back soon after more matches are processed.
          </div>
        )}
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
    </main>
  );
}
