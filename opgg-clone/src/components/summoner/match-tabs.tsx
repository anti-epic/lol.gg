"use client";

import { useState, useMemo } from "react";
import Image from "next/image";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MatchSummary = {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  queueId: number;
  win: boolean;
  championId: number;
  championName: string;
  champLevel: number;
  teamPosition: string;
  spell1Id: number;
  spell2Id: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  csPerMin: number;
  items: number[];
};

export type MasterySummary = {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
};

interface Props {
  matches: MatchSummary[];
  spellImages: Record<number, string>;
  version: string;
  masteries: MasterySummary[];
  championKeyMap: Record<number, string>; // numeric id → DDragon string id e.g. 103 → "Ahri"
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Tab definitions — queueIds: null means "show all"
const TAB_DEFS: { id: string; label: string; queueIds: number[] | null }[] = [
  { id: "all", label: "All", queueIds: null },
  { id: "ranked-solo", label: "Ranked Solo", queueIds: [420] },
  { id: "ranked-flex", label: "Ranked Flex", queueIds: [440] },
  { id: "aram", label: "ARAM", queueIds: [450] },
  { id: "normal", label: "Normal", queueIds: [400, 490] },
  { id: "other", label: "Other", queueIds: [900, 1020, 1900, 1400, 1700, 1300] },
];

type TabId = string;

const QUEUE_NAMES: Record<number, string> = {
  420: "Ranked Solo",
  440: "Ranked Flex",
  450: "ARAM",
  400: "Normal",
  490: "Quickplay",
  900: "URF",
  1020: "One for All",
  1900: "URF",
  1400: "Spellbook",
  1700: "Arena",
  1300: "Nexus Blitz",
};

// ---------------------------------------------------------------------------
// DDragon URL helpers (pure string fns — safe for client components)
// ---------------------------------------------------------------------------

const CDN = "https://ddragon.leagueoflegends.com";
const champIconUrl = (v: string, name: string) => `${CDN}/cdn/${v}/img/champion/${name}.png`;
const spellIconUrl = (v: string, file: string) => `${CDN}/cdn/${v}/img/spell/${file}`;
const itemIconUrl = (v: string, id: string) => `${CDN}/cdn/${v}/img/item/${id}.png`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatPoints(pts: number): string {
  if (pts >= 1_000_000) return `${(pts / 1_000_000).toFixed(2)}M`;
  if (pts >= 1_000) return `${(pts / 1_000).toFixed(0)}k`;
  return String(pts);
}

const MASTERY_STYLES: Record<number, { badge: string; glow: string }> = {
  10: {
    badge: "bg-gradient-to-br from-yellow-200 to-orange-400 text-black",
    glow: "shadow-[0_0_8px_2px_rgba(250,204,21,0.4)]",
  },
  9: { badge: "bg-yellow-400 text-black", glow: "shadow-[0_0_6px_1px_rgba(250,204,21,0.3)]" },
  8: { badge: "bg-yellow-500 text-black", glow: "shadow-[0_0_6px_1px_rgba(234,179,8,0.3)]" },
  7: { badge: "bg-yellow-600 text-white", glow: "" },
  6: { badge: "bg-purple-500 text-white", glow: "" },
  5: { badge: "bg-red-500 text-white", glow: "" },
  4: { badge: "bg-cyan-600 text-white", glow: "" },
};
function masteryStyle(level: number) {
  return MASTERY_STYLES[level] ?? { badge: "bg-muted text-muted-foreground", glow: "" };
}

function buildChampStats(filtered: MatchSummary[]) {
  const map = new Map<string, { games: number; wins: number; k: number; d: number; a: number }>();
  for (const m of filtered) {
    const s = map.get(m.championName) ?? { games: 0, wins: 0, k: 0, d: 0, a: 0 };
    s.games++;
    s.wins += m.win ? 1 : 0;
    s.k += m.kills;
    s.d += m.deaths;
    s.a += m.assists;
    map.set(m.championName, s);
  }
  return [...map.entries()]
    .map(([name, s]) => ({
      name,
      games: s.games,
      winRate: s.wins / s.games,
      kda: (s.k + s.a) / Math.max(s.d, 1),
      avgK: s.k / s.games,
      avgD: s.d / s.games,
      avgA: s.a / s.games,
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 7);
}

// ---------------------------------------------------------------------------
// Match card
// ---------------------------------------------------------------------------

function MatchCard({
  m,
  spellImages,
  version,
}: {
  m: MatchSummary;
  spellImages: Record<number, string>;
  version: string;
}) {
  const spell1 = spellImages[m.spell1Id] ?? "SummonerFlash.png";
  const spell2 = spellImages[m.spell2Id] ?? "SummonerFlash.png";
  const queueName = QUEUE_NAMES[m.queueId] ?? "Custom";
  const kdaColor =
    m.kda >= 5 ? "text-yellow-400" : m.kda >= 3 ? "text-blue-400" : "text-foreground";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        m.win
          ? "border-l-4 border-blue-500/50 bg-blue-950/20"
          : "border-l-4 border-red-500/50 bg-red-950/20"
      }`}
    >
      {/* W/L */}
      <span
        className={`w-8 shrink-0 text-center text-xs font-bold ${m.win ? "text-blue-400" : "text-red-400"}`}
      >
        {m.win ? "W" : "L"}
      </span>

      {/* Champion icon + level */}
      <div className="relative shrink-0">
        <Image
          src={champIconUrl(version, m.championName)}
          alt={m.championName}
          width={40}
          height={40}
          className="rounded-full border border-border"
        />
        <span className="absolute -bottom-1 -right-1 rounded-full bg-background px-1 text-[10px] font-bold text-muted-foreground">
          {m.champLevel}
        </span>
      </div>

      {/* Spells */}
      <div className="flex shrink-0 flex-col gap-0.5">
        <Image
          src={spellIconUrl(version, spell1)}
          alt=""
          width={18}
          height={18}
          className="rounded"
        />
        <Image
          src={spellIconUrl(version, spell2)}
          alt=""
          width={18}
          height={18}
          className="rounded"
        />
      </div>

      {/* Champion name + position */}
      <div className="hidden w-20 shrink-0 sm:block">
        <p className="truncate text-xs font-semibold text-foreground">{m.championName}</p>
        {m.teamPosition && <p className="text-[10px] text-muted-foreground">{m.teamPosition}</p>}
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
        <p className="text-[10px] text-muted-foreground">{m.csPerMin.toFixed(1)}/min</p>
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
            <div key={idx} className="h-[22px] w-[22px] rounded border border-border bg-muted" />
          )
        )}
      </div>

      {/* Game info */}
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-xs font-medium text-muted-foreground">{queueName}</p>
        <p className="text-[10px] text-muted-foreground">{timeAgo(m.gameCreation)}</p>
        <p className="text-[10px] text-muted-foreground">{formatDuration(m.gameDuration)}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function MatchTabs({ matches, spellImages, version, masteries, championKeyMap }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("all");

  const isMasteryTab = activeTab === "mastery";

  // Only show match-mode tabs that have at least one match (always show "all")
  const visibleMatchTabs = useMemo(
    () =>
      TAB_DEFS.filter((tab) => {
        if (tab.id === "all") return true;
        return matches.some((m) => tab.queueIds!.includes(m.queueId));
      }),
    [matches]
  );

  // Filtered matches for active tab (irrelevant when mastery tab is active)
  const filtered = useMemo(() => {
    if (isMasteryTab) return [];
    const def = TAB_DEFS.find((t) => t.id === activeTab);
    if (!def || def.queueIds === null) return matches;
    return matches.filter((m) => (def.queueIds as number[]).includes(m.queueId));
  }, [matches, activeTab, isMasteryTab]);

  // Win rate summary for active tab
  const summary = useMemo(() => {
    if (filtered.length === 0) return null;
    const wins = filtered.filter((m) => m.win).length;
    return { wins, losses: filtered.length - wins, winRate: wins / filtered.length };
  }, [filtered]);

  // Champion stats for active tab
  const champStats = useMemo(() => buildChampStats(filtered), [filtered]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left: tabs + content */}
      <div className="min-w-0 flex-1">
        {/* Tab bar */}
        <div className="mb-3 flex flex-wrap items-center gap-1 border-b border-border">
          {/* Game mode tabs */}
          {visibleMatchTabs.map((tab) => {
            const count =
              tab.id === "all"
                ? matches.length
                : matches.filter((m) => tab.queueIds!.includes(m.queueId)).length;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-t px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Divider */}
          {masteries.length > 0 && <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />}

          {/* Mastery tab */}
          {masteries.length > 0 && (
            <button
              onClick={() => setActiveTab("mastery")}
              className={`flex items-center gap-1.5 rounded-t px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isMasteryTab
                  ? "border-b-2 border-yellow-400 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mastery
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isMasteryTab
                    ? "bg-yellow-400/20 text-yellow-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {masteries.length}
              </span>
            </button>
          )}
        </div>

        {/* ── Mastery view ── */}
        {isMasteryTab ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {masteries.map((m) => {
              const champName = championKeyMap[m.championId];
              if (!champName) return null;
              const style = masteryStyle(m.championLevel);
              const hasProgress = m.championPointsUntilNextLevel > 0;
              const progressPct = hasProgress
                ? (m.championPointsSinceLastLevel /
                    (m.championPointsSinceLastLevel + m.championPointsUntilNextLevel)) *
                  100
                : 100;

              return (
                <div
                  key={m.championId}
                  className={`flex items-center gap-3 rounded-xl border border-border bg-card p-3 ${style.glow}`}
                >
                  {/* Champion icon */}
                  <div className="relative shrink-0">
                    <Image
                      src={champIconUrl(version, champName)}
                      alt={champName}
                      width={48}
                      height={48}
                      className="rounded-full border border-border"
                    />
                    {/* Mastery level badge */}
                    <span
                      className={`absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none ${style.badge}`}
                    >
                      {m.championLevel}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{champName}</p>
                      {m.chestGranted && (
                        <span
                          className="shrink-0 text-xs text-yellow-400"
                          title="Season chest earned"
                        >
                          ✦
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatPoints(m.championPoints)} pts · {timeAgo(m.lastPlayTime)}
                    </p>
                    {/* Progress bar */}
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          m.championLevel >= 10
                            ? "bg-gradient-to-r from-yellow-300 to-orange-400"
                            : m.championLevel >= 7
                              ? "bg-yellow-400"
                              : m.championLevel >= 5
                                ? "bg-purple-400"
                                : "bg-primary"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    {hasProgress && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatPoints(m.championPointsUntilNextLevel)} to next level
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {/* Win rate summary bar */}
            {summary && (
              <div className="mb-3 flex items-center gap-3 text-sm">
                <span className="font-semibold text-foreground">{filtered.length}G</span>
                <span className="text-blue-400">{summary.wins}W</span>
                <span className="text-red-400">{summary.losses}L</span>
                <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${summary.winRate * 100}%` }}
                  />
                </div>
                <span
                  className={
                    summary.winRate > 0.52
                      ? "font-bold text-blue-400"
                      : summary.winRate < 0.48
                        ? "font-bold text-red-400"
                        : "text-muted-foreground"
                  }
                >
                  {Math.round(summary.winRate * 100)}%
                </span>
              </div>
            )}

            {/* Match list */}
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No matches found for this mode.
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((m) => (
                  <MatchCard key={m.matchId} m={m} spellImages={spellImages} version={version} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Right: champion stats sidebar (hidden on mastery tab) */}
      {!isMasteryTab && (
        <div className="w-full lg:w-64 lg:shrink-0">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Champion Stats</h2>
          {champStats.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
              No data.
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
                  <div key={c.name} className="flex items-center gap-3">
                    <Image
                      src={champIconUrl(version, c.name)}
                      alt={c.name}
                      width={32}
                      height={32}
                      className="shrink-0 rounded-full border border-border"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.games}G ·{" "}
                        <span className="text-foreground">
                          {c.avgK.toFixed(1)}/{c.avgD.toFixed(1)}/{c.avgA.toFixed(1)}
                        </span>{" "}
                        · {c.kda.toFixed(2)} KDA
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-bold ${wrColor}`}>
                      {Math.round(c.winRate * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
