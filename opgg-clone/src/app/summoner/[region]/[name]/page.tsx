import { type Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { cache as redisCache } from "@/server/services/cache";
import {
  getAccountByRiotId,
  getSummonerByPuuid,
  getRankedData,
  getRecentMatchIds,
  getMatch,
  type RiotMatch,
  type RiotLeagueEntry,
  type RiotMatchParticipant,
} from "@/server/services/riot";
import { processMatchForBuildStats } from "@/lib/build-aggregator";
import {
  getDDragonVersion,
  getSummonerSpellImages,
  profileIconUrl,
  summonerSpellIconUrl,
  championIconUrl,
  itemIconUrl,
} from "@/lib/ddragon";

// SSR — data is dynamic and needs to be fresh on every load (per architecture.md)
interface PageProps {
  params: Promise<{ region: string; name: string }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseRiotId(raw: string): { gameName: string; tagLine: string } | null {
  const decoded = decodeURIComponent(raw);
  const idx = decoded.indexOf("#");
  if (idx === -1) return null;
  const gameName = decoded.slice(0, idx).trim();
  const tagLine = decoded.slice(idx + 1).trim();
  if (!gameName || !tagLine) return null;
  return { gameName, tagLine };
}

function timeAgo(timestampMs: number): string {
  const diff = Date.now() - timestampMs;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  return `${days}d ago`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const QUEUE_NAMES: Record<number, string> = {
  420: "Ranked Solo",
  440: "Ranked Flex",
  450: "ARAM",
  400: "Normal",
  900: "URF",
  1020: "One for All",
  1900: "URF",
  490: "Quickplay",
};

const TIER_COLORS: Record<string, string> = {
  IRON: "text-gray-400",
  BRONZE: "text-amber-700",
  SILVER: "text-slate-400",
  GOLD: "text-yellow-400",
  PLATINUM: "text-cyan-400",
  EMERALD: "text-emerald-400",
  DIAMOND: "text-blue-400",
  MASTER: "text-purple-400",
  GRANDMASTER: "text-red-400",
  CHALLENGER: "text-yellow-300",
};

const TIER_BG: Record<string, string> = {
  IRON: "bg-gray-400/10",
  BRONZE: "bg-amber-700/10",
  SILVER: "bg-slate-400/10",
  GOLD: "bg-yellow-400/10",
  PLATINUM: "bg-cyan-400/10",
  EMERALD: "bg-emerald-400/10",
  DIAMOND: "bg-blue-400/10",
  MASTER: "bg-purple-400/10",
  GRANDMASTER: "bg-red-400/10",
  CHALLENGER: "bg-yellow-300/10",
};

function buildMatchSummary(match: RiotMatch, puuid: string) {
  const p = match.info.participants.find((x: RiotMatchParticipant) => x.puuid === puuid);
  if (!p) return null;
  const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
  const durationMinutes = match.info.gameDuration / 60;
  return {
    matchId: match.metadata.matchId,
    gameCreation: match.info.gameCreation,
    gameDuration: match.info.gameDuration,
    queueId: match.info.queueId,
    win: p.win,
    championId: p.championId,
    championName: p.championName,
    champLevel: p.champLevel,
    teamPosition: p.teamPosition,
    spell1Id: p.spell1Id,
    spell2Id: p.spell2Id,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    kda: (p.kills + p.assists) / Math.max(p.deaths, 1),
    cs,
    csPerMin: cs / Math.max(durationMinutes, 1),
    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
  };
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { region, name } = await params;
  const parsed = parseRiotId(name);
  const displayName = parsed ? `${parsed.gameName}#${parsed.tagLine}` : decodeURIComponent(name);
  return {
    title: `${displayName} (${region.toUpperCase()}) — lol.gg`,
    description: `League of Legends stats, rank, and match history for ${displayName} in ${region.toUpperCase()}`,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RankCard({ label, entry }: { label: string; entry: RiotLeagueEntry | undefined }) {
  const tierColor = entry
    ? (TIER_COLORS[entry.tier] ?? "text-foreground")
    : "text-muted-foreground";
  const tierBg = entry ? (TIER_BG[entry.tier] ?? "bg-muted") : "bg-muted";
  const winRate = entry
    ? Math.round((entry.wins / Math.max(entry.wins + entry.losses, 1)) * 100)
    : null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {entry ? (
        <div className="mt-2 flex items-center gap-3">
          <span className={`rounded-lg px-3 py-1.5 text-sm font-bold ${tierColor} ${tierBg}`}>
            {entry.tier}
          </span>
          <div>
            <p className={`text-xl font-bold ${tierColor}`}>
              {entry.rank} · {entry.leaguePoints} LP
            </p>
            <p className="text-sm text-muted-foreground">
              {entry.wins}W {entry.losses}L · {winRate}% WR
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-muted-foreground">Unranked</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SummonerPage({ params }: PageProps) {
  const { region, name } = await params;
  const regionKey = region.toLowerCase();

  const parsed = parseRiotId(name);
  if (!parsed) notFound();
  const { gameName, tagLine } = parsed;
  const riotId = `${gameName}#${tagLine}`;

  // ---------------------------------------------------------------------------
  // Data fetching (with Redis cache mirroring the summoner router)
  // ---------------------------------------------------------------------------

  let account: Awaited<ReturnType<typeof getAccountByRiotId>>;
  try {
    const accountCacheKey = `account:${regionKey}:${riotId.toLowerCase()}`;
    const cachedAccount = await redisCache.get<typeof account>(accountCacheKey);
    if (cachedAccount) {
      account = cachedAccount;
    } else {
      account = await getAccountByRiotId(gameName, tagLine, regionKey);
      await redisCache.set(accountCacheKey, account, 300);
    }
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  const [summoner, rankEntries, version] = await Promise.all([
    (async () => {
      const key = `summoner-data:${account.puuid}`;
      const cached = await redisCache.get<Awaited<ReturnType<typeof getSummonerByPuuid>>>(key);
      if (cached) return cached;
      const data = await getSummonerByPuuid(account.puuid, regionKey);
      await redisCache.set(key, data, 300);
      return data;
    })(),
    (async () => {
      const key = `ranks:${account.puuid}`;
      const cached = await redisCache.get<RiotLeagueEntry[]>(key);
      if (cached) return cached;
      const data = await getRankedData(account.puuid, regionKey);
      await redisCache.set(key, data, 300);
      return data;
    })(),
    getDDragonVersion(),
  ]);

  // Match history
  const matchIds = await (async () => {
    const key = `match-ids:${regionKey}:${account.puuid}`;
    const cached = await redisCache.get<string[]>(key);
    if (cached) return cached;
    const ids = await getRecentMatchIds(account.puuid, regionKey, 20);
    await redisCache.set(key, ids, 300);
    return ids;
  })();

  const rawMatches = await Promise.all(
    matchIds.map(async (matchId) => {
      const key = `match:${matchId}`;
      const cached = await redisCache.get<RiotMatch>(key);
      if (cached) return cached;
      try {
        const match = await getMatch(matchId, regionKey);
        await redisCache.set(key, match, 365 * 24 * 60 * 60);
        void processMatchForBuildStats(match).catch(console.error);
        return match;
      } catch {
        return null;
      }
    })
  );

  const matches = rawMatches
    .filter((m): m is RiotMatch => m !== null)
    .map((m) => buildMatchSummary(m, account.puuid))
    .filter((s): s is NonNullable<ReturnType<typeof buildMatchSummary>> => s !== null);

  // DDragon spell image map
  const spellImages = await getSummonerSpellImages(version);

  // ---------------------------------------------------------------------------
  // Compute champion stats from match history
  // ---------------------------------------------------------------------------

  const champMap = new Map<
    string,
    { games: number; wins: number; kills: number; deaths: number; assists: number }
  >();
  for (const m of matches) {
    const s = champMap.get(m.championName) ?? {
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    };
    s.games += 1;
    s.wins += m.win ? 1 : 0;
    s.kills += m.kills;
    s.deaths += m.deaths;
    s.assists += m.assists;
    champMap.set(m.championName, s);
  }
  const champStats = [...champMap.entries()]
    .map(([championName, s]) => ({
      championName,
      games: s.games,
      wins: s.wins,
      winRate: s.wins / s.games,
      avgKills: s.kills / s.games,
      avgDeaths: s.deaths / s.games,
      avgAssists: s.assists / s.games,
      kda: (s.kills + s.assists) / Math.max(s.deaths, 1),
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 7);

  // Rank shortcuts
  const soloEntry = rankEntries.find((r) => r.queueType === "RANKED_SOLO_5x5");
  const flexEntry = rankEntries.find((r) => r.queueType === "RANKED_FLEX_SR");

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main id="main-content" className="mx-auto max-w-5xl space-y-6 p-6">
      {/* ── Profile Header ── */}
      <section className="flex items-center gap-5">
        <div className="relative shrink-0">
          <Image
            src={profileIconUrl(version, summoner.profileIconId)}
            alt="Profile icon"
            width={80}
            height={80}
            className="rounded-full border-2 border-border"
          />
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {summoner.summonerLevel}
          </span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{riotId}</h1>
          <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground uppercase">
            {regionKey}
          </span>
        </div>
      </section>

      {/* ── Rank Cards ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RankCard label="Ranked Solo / Duo" entry={soloEntry} />
        <RankCard label="Ranked Flex" entry={flexEntry} />
      </section>

      {/* ── Main content: match history + champion stats ── */}
      <section className="flex flex-col gap-6 lg:flex-row">
        {/* Match History */}
        <div className="min-w-0 flex-1">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Match History</h2>
          {matches.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No recent matches found.
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map((m) => {
                const spell1File = spellImages[m.spell1Id] ?? "SummonerFlash.png";
                const spell2File = spellImages[m.spell2Id] ?? "SummonerFlash.png";
                const queueName = QUEUE_NAMES[m.queueId] ?? "Custom";
                const kdaColor =
                  m.kda >= 5 ? "text-yellow-400" : m.kda >= 3 ? "text-blue-400" : "text-foreground";

                return (
                  <div
                    key={m.matchId}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${
                      m.win
                        ? "border-l-4 border-blue-500/50 bg-blue-950/20"
                        : "border-l-4 border-red-500/50 bg-red-950/20"
                    }`}
                  >
                    {/* Win/loss badge */}
                    <span
                      className={`w-8 shrink-0 text-center text-xs font-bold ${m.win ? "text-blue-400" : "text-red-400"}`}
                    >
                      {m.win ? "W" : "L"}
                    </span>

                    {/* Champion icon */}
                    <div className="relative shrink-0">
                      <Image
                        src={championIconUrl(version, `${m.championName}.png`)}
                        alt={m.championName}
                        width={40}
                        height={40}
                        className="rounded-full border border-border"
                      />
                      <span className="absolute -bottom-1 -right-1 rounded-full bg-background px-1 text-[10px] font-bold text-muted-foreground">
                        {m.champLevel}
                      </span>
                    </div>

                    {/* Summoner spells */}
                    <div className="flex shrink-0 flex-col gap-0.5">
                      <Image
                        src={summonerSpellIconUrl(version, spell1File)}
                        alt={`Spell ${m.spell1Id}`}
                        width={18}
                        height={18}
                        className="rounded"
                      />
                      <Image
                        src={summonerSpellIconUrl(version, spell2File)}
                        alt={`Spell ${m.spell2Id}`}
                        width={18}
                        height={18}
                        className="rounded"
                      />
                    </div>

                    {/* Champion name + position */}
                    <div className="hidden w-20 shrink-0 sm:block">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {m.championName}
                      </p>
                      {m.teamPosition && (
                        <p className="text-[10px] text-muted-foreground">{m.teamPosition}</p>
                      )}
                    </div>

                    {/* KDA */}
                    <div className="w-24 shrink-0 text-center">
                      <p className="text-sm font-semibold text-foreground">
                        {m.kills} / <span className="text-red-400">{m.deaths}</span> / {m.assists}
                      </p>
                      <p className={`text-xs font-bold ${kdaColor}`}>{m.kda.toFixed(2)} KDA</p>
                    </div>

                    {/* CS */}
                    <div className="hidden w-16 shrink-0 text-center sm:block">
                      <p className="text-xs text-foreground">{m.cs} CS</p>
                      <p className="text-[10px] text-muted-foreground">
                        {m.csPerMin.toFixed(1)}/min
                      </p>
                    </div>

                    {/* Items */}
                    <div className="flex flex-1 flex-wrap gap-0.5">
                      {m.items.map((itemId, idx) =>
                        itemId > 0 ? (
                          <Image
                            key={idx}
                            src={itemIconUrl(version, String(itemId))}
                            alt={`Item ${itemId}`}
                            width={22}
                            height={22}
                            className="rounded border border-border"
                          />
                        ) : (
                          <div
                            key={idx}
                            className="h-[22px] w-[22px] rounded border border-border bg-muted"
                          />
                        )
                      )}
                    </div>

                    {/* Game info */}
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-xs font-medium text-muted-foreground">{queueName}</p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(m.gameCreation)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDuration(m.gameDuration)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Champion Stats sidebar */}
        <div className="w-full lg:w-64 lg:shrink-0">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Champion Stats</h2>
          {champStats.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
              No data yet.
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-border bg-card p-4">
              {champStats.map((c) => {
                const wrColor =
                  c.winRate > 0.52
                    ? "text-green-400"
                    : c.winRate < 0.48
                      ? "text-red-400"
                      : "text-muted-foreground";
                return (
                  <div key={c.championName} className="flex items-center gap-3">
                    <Image
                      src={championIconUrl(version, `${c.championName}.png`)}
                      alt={c.championName}
                      width={32}
                      height={32}
                      className="shrink-0 rounded-full border border-border"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {c.championName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.games}G · {c.kda.toFixed(2)} KDA
                      </p>
                    </div>
                    <span className={`text-xs font-bold ${wrColor}`}>
                      {Math.round(c.winRate * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
