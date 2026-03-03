import { TRPCError } from "@trpc/server";

// ---------------------------------------------------------------------------
// Region routing
// ---------------------------------------------------------------------------

/** Platform endpoints — Summoner-v4, League-v4 */
const PLATFORM_HOST: Record<string, string> = {
  na1: "na1.api.riotgames.com",
  euw1: "euw1.api.riotgames.com",
  eun1: "eun1.api.riotgames.com",
  kr: "kr.api.riotgames.com",
  jp1: "jp1.api.riotgames.com",
  br1: "br1.api.riotgames.com",
  la1: "la1.api.riotgames.com",
  la2: "la2.api.riotgames.com",
  oc1: "oc1.api.riotgames.com",
  tr1: "tr1.api.riotgames.com",
  ru: "ru.api.riotgames.com",
};

/** Regional endpoints — Account-v1, Match-v5 */
const REGIONAL_HOST: Record<string, string> = {
  na1: "americas.api.riotgames.com",
  br1: "americas.api.riotgames.com",
  la1: "americas.api.riotgames.com",
  la2: "americas.api.riotgames.com",
  oc1: "americas.api.riotgames.com",
  euw1: "europe.api.riotgames.com",
  eun1: "europe.api.riotgames.com",
  tr1: "europe.api.riotgames.com",
  ru: "europe.api.riotgames.com",
  kr: "asia.api.riotgames.com",
  jp1: "asia.api.riotgames.com",
};

function platformHost(region: string): string {
  const host = PLATFORM_HOST[region.toLowerCase()];
  if (!host)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Unknown region: ${region}`,
    });
  return host;
}

function regionalHost(region: string): string {
  const host = REGIONAL_HOST[region.toLowerCase()];
  if (!host)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Unknown region: ${region}`,
    });
  return host;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotSummoner {
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface RiotLeagueEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface RiotMatchParticipant {
  puuid: string;
  championId: number;
  championName: string;
  teamId: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
}

export interface RiotMatch {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    gameType: string;
    gameVersion: string;
    queueId: number;
    participants: RiotMatchParticipant[];
  };
}

// ---------------------------------------------------------------------------
// Base fetch
// ---------------------------------------------------------------------------

async function riotFetch<T>(url: string): Promise<T> {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Riot API key is not configured",
    });
  }

  const res = await fetch(url, {
    headers: { "X-Riot-Token": apiKey },
    // Don't let Next.js cache this — we handle caching ourselves via Redis
    cache: "no-store",
  });

  if (res.status === 404) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Summoner not found. Check the Riot ID and region.",
    });
  }
  if (res.status === 429) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Service is busy. Please try again in a moment.",
    });
  }
  if (res.status === 403) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Riot API key is invalid or expired.",
    });
  }
  if (!res.ok) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Riot API error (${res.status})`,
    });
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/** Account-v1: resolve Riot ID → PUUID */
export async function getAccountByRiotId(
  gameName: string,
  tagLine: string,
  region: string
): Promise<RiotAccount> {
  const host = regionalHost(region);
  return riotFetch<RiotAccount>(
    `https://${host}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );
}

/** Summoner-v4: get summoner data by PUUID */
export async function getSummonerByPuuid(puuid: string, region: string): Promise<RiotSummoner> {
  const host = platformHost(region);
  return riotFetch<RiotSummoner>(`https://${host}/lol/summoner/v4/summoners/by-puuid/${puuid}`);
}

/** League-v4: get ranked entries for a summoner by PUUID */
export async function getRankedData(puuid: string, region: string): Promise<RiotLeagueEntry[]> {
  const host = platformHost(region);
  return riotFetch<RiotLeagueEntry[]>(`https://${host}/lol/league/v4/entries/by-puuid/${puuid}`);
}

/** Match-v5: get recent match IDs for a PUUID */
export async function getRecentMatchIds(
  puuid: string,
  region: string,
  count = 20
): Promise<string[]> {
  const host = regionalHost(region);
  return riotFetch<string[]>(
    `https://${host}/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`
  );
}

/** Match-v5: get full match data */
export async function getMatch(matchId: string, region: string): Promise<RiotMatch> {
  const host = regionalHost(region);
  return riotFetch<RiotMatch>(`https://${host}/lol/match/v5/matches/${matchId}`);
}
