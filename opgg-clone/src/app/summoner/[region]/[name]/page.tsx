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
  getChampionMasteries,
  type RiotMatch,
  type RiotLeagueEntry,
  type RiotMatchParticipant,
  type RiotChampionMastery,
} from "@/server/services/riot";
import { processMatchForBuildStats } from "@/lib/build-aggregator";
import {
  getDDragonVersion,
  getSummonerSpellImages,
  getChampionKeyMap,
  profileIconUrl,
} from "@/lib/ddragon";
import { MatchTabs } from "@/components/summoner/match-tabs";
import { RefreshButton } from "@/components/summoner/refresh-button";

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

function buildMatchSummary(match: RiotMatch, puuid: string) {
  const p = match.info.participants.find((x: RiotMatchParticipant) => x.puuid === puuid);
  if (!p) return null;
  const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
  const durationMinutes = match.info.gameDuration / 60;
  const teamKills = match.info.participants
    .filter((pp) => pp.teamId === p.teamId)
    .reduce((sum, pp) => sum + pp.kills, 0);
  const multiKill =
    p.pentaKills > 0
      ? "Penta Kill"
      : p.quadraKills > 0
        ? "Quadra Kill"
        : p.tripleKills > 0
          ? "Triple Kill"
          : p.doubleKills > 0
            ? "Double Kill"
            : null;
  const allParticipants = match.info.participants.map((pp) => ({
    puuid: pp.puuid,
    riotIdGameName: pp.riotIdGameName,
    riotIdTagline: pp.riotIdTagline,
    championName: pp.championName,
    champLevel: pp.champLevel,
    teamId: pp.teamId,
    win: pp.win,
    kills: pp.kills,
    deaths: pp.deaths,
    assists: pp.assists,
    cs: pp.totalMinionsKilled + pp.neutralMinionsKilled,
    damage: pp.totalDamageDealtToChampions,
    spell1Id: pp.summoner1Id,
    spell2Id: pp.summoner2Id,
    items: [pp.item0, pp.item1, pp.item2, pp.item3, pp.item4, pp.item5, pp.item6],
    isQueried: pp.puuid === puuid,
  }));
  return {
    matchId: match.metadata.matchId,
    gameCreation: match.info.gameCreation,
    gameDuration: match.info.gameDuration,
    queueId: match.info.queueId,
    win: p.win,
    championName: p.championName,
    champLevel: p.champLevel,
    teamPosition: p.teamPosition,
    spell1Id: p.summoner1Id,
    spell2Id: p.summoner2Id,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    kda: (p.kills + p.assists) / Math.max(p.deaths, 1),
    killParticipation: (p.kills + p.assists) / Math.max(teamKills, 1),
    multiKill,
    cs,
    csPerMin: cs / Math.max(durationMinutes, 1),
    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
    allParticipants,
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
// Rank card (server component — no interactivity needed)
// ---------------------------------------------------------------------------

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
  // Data fetching (with Redis cache)
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

  const [summoner, rankEntries, version, masteries] = await Promise.all([
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
    (async () => {
      const key = `masteries:${account.puuid}`;
      const cached = await redisCache.get<RiotChampionMastery[]>(key);
      if (cached) return cached;
      const data = await getChampionMasteries(account.puuid, regionKey);
      await redisCache.set(key, data, 300);
      return data;
    })(),
  ]);

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

  const [spellImages, championKeyMap] = await Promise.all([
    getSummonerSpellImages(version),
    getChampionKeyMap(version),
  ]);

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
        <div className="flex flex-1 items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{riotId}</h1>
            <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium uppercase text-muted-foreground">
              {regionKey}
            </span>
          </div>
          <RefreshButton puuid={account.puuid} region={regionKey} />
        </div>
      </section>

      {/* ── Rank Cards ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RankCard label="Ranked Solo / Duo" entry={soloEntry} />
        <RankCard label="Ranked Flex" entry={flexEntry} />
      </section>

      {/* ── Tabbed match history + champion stats ── */}
      <section>
        <MatchTabs
          matches={matches}
          spellImages={spellImages}
          version={version}
          masteries={masteries}
          championKeyMap={championKeyMap}
          region={regionKey}
        />
      </section>
    </main>
  );
}
