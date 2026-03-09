"use client";

import { useState } from "react";
import Image from "next/image";
import type { AramChampionModifiers } from "@/lib/ddragon";

// ---------------------------------------------------------------------------
// Types (mirroring what the server passes down)
// ---------------------------------------------------------------------------

export type ModeItem = {
  itemId: number;
  winRate: number;
  games: number;
};

export type ModeData = {
  queueId: number;
  totalGames: number;
  winRate: number | null;
  items: ModeItem[];
  roles: string[];
};

interface Props {
  modes: ModeData[];
  version: string;
  aramModifiers: AramChampionModifiers | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUEUE_META: Record<number, { label: string; short: string }> = {
  420: { label: "Ranked Solo/Duo", short: "Ranked" },
  440: { label: "Ranked Flex", short: "Flex" },
  490: { label: "Normal", short: "Normal" },
  450: { label: "ARAM", short: "ARAM" },
  900: { label: "URF", short: "URF" },
  1700: { label: "Arena", short: "Arena" },
  1020: { label: "One for All", short: "OFA" },
  1300: { label: "Nexus Blitz", short: "Nexus Blitz" },
};

// Preferred display order
const QUEUE_ORDER = [420, 450, 1700, 900, 440, 490, 1020, 1300];

const ROLE_LABELS: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "Bot",
  UTILITY: "Support",
};

const CDN = "https://ddragon.leagueoflegends.com";
const itemIconUrl = (v: string, id: number) => `${CDN}/cdn/${v}/img/item/${id}.png`;

// ---------------------------------------------------------------------------
// ARAM balance section
// ---------------------------------------------------------------------------

type ModStat = { label: string; value: number; isPercent: boolean; higherIsBetter: boolean };

function buildAramStats(m: AramChampionModifiers): ModStat[] {
  return [
    { label: "Damage dealt", value: m.damageDealtMod, isPercent: true, higherIsBetter: true },
    { label: "Damage taken", value: m.damageReceivedMod, isPercent: true, higherIsBetter: false },
    { label: "Healing", value: m.healingReceivedMod, isPercent: true, higherIsBetter: true },
    { label: "Shielding", value: m.shieldMod, isPercent: true, higherIsBetter: true },
    { label: "Attack speed", value: m.attackSpeedMod, isPercent: false, higherIsBetter: true },
    {
      label: "Ability haste",
      value: m.abilityHasteMultiplier,
      isPercent: false,
      higherIsBetter: true,
    },
    { label: "Energy regen", value: m.energyRegenMod, isPercent: false, higherIsBetter: true },
  ].filter((s) => {
    // Only show stats that are actually modified
    if (s.isPercent) return Math.abs(s.value - 1) >= 0.001;
    return Math.abs(s.value) >= 0.001;
  });
}

function AramBalanceSection({ modifiers }: { modifiers: AramChampionModifiers }) {
  const stats = buildAramStats(modifiers);
  if (stats.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        No balance adjustments for this champion in ARAM.
      </p>
    );

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Balance Adjustments
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => {
          let display: string;
          let colorClass: string;

          if (s.isPercent) {
            const pct = Math.round((s.value - 1) * 100);
            display = pct === 0 ? "—" : `${pct > 0 ? "+" : ""}${pct}%`;
            const isBuff = s.higherIsBetter ? pct > 0 : pct < 0;
            colorClass =
              pct === 0 ? "text-muted-foreground" : isBuff ? "text-green-400" : "text-red-400";
          } else {
            display = s.value === 0 ? "—" : `${s.value > 0 ? "+" : ""}${s.value}`;
            const isBuff = s.higherIsBetter ? s.value > 0 : s.value < 0;
            colorClass =
              s.value === 0 ? "text-muted-foreground" : isBuff ? "text-green-400" : "text-red-400";
          }

          return (
            <div key={s.label} className="rounded-lg border border-border bg-card p-3">
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className={`mt-0.5 text-base font-bold ${colorClass}`}>{display}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Item grid
// ---------------------------------------------------------------------------

function ItemGrid({ items, version }: { items: ModeItem[]; version: string }) {
  if (items.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Not enough data yet — check back after more matches are processed.
      </p>
    );

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => {
        const wrColor =
          item.winRate > 0.52
            ? "text-green-400"
            : item.winRate < 0.48
              ? "text-red-400"
              : "text-muted-foreground";
        return (
          <div key={item.itemId} className="flex flex-col items-center gap-1">
            <Image
              src={itemIconUrl(version, item.itemId)}
              alt={`Item ${item.itemId}`}
              width={44}
              height={44}
              className="rounded border border-border"
            />
            <span className={`text-[10px] font-bold leading-none ${wrColor}`}>
              {(item.winRate * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] leading-none text-muted-foreground">
              {item.games >= 1000 ? `${(item.games / 1000).toFixed(1)}k` : item.games}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ModeBuildTabs({ modes, version, aramModifiers }: Props) {
  const sorted = [...modes].sort(
    (a, b) => QUEUE_ORDER.indexOf(a.queueId) - QUEUE_ORDER.indexOf(b.queueId)
  );

  const [activeQueueId, setActiveQueueId] = useState(sorted[0]?.queueId ?? 420);
  const [activeRole, setActiveRole] = useState<string>("");

  const active = sorted.find((m) => m.queueId === activeQueueId) ?? sorted[0];

  if (!active) return null;

  const isRanked = active.queueId === 420 || active.queueId === 440 || active.queueId === 490;
  const roleOptions = isRanked ? active.roles : [];

  // When switching tabs, reset role to the first available (or empty)
  function handleTabChange(queueId: number) {
    setActiveQueueId(queueId);
    const mode = sorted.find((m) => m.queueId === queueId);
    setActiveRole(mode?.roles[0] ?? "");
  }

  const filteredItems =
    isRanked && activeRole
      ? active.items // already filtered server-side per role when role was passed
      : active.items;

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-4 flex flex-wrap gap-1 border-b border-border">
        {sorted.map((m) => {
          const meta = QUEUE_META[m.queueId] ?? {
            label: `Queue ${m.queueId}`,
            short: `Q${m.queueId}`,
          };
          const isActive = m.queueId === activeQueueId;
          return (
            <button
              key={m.queueId}
              onClick={() => handleTabChange(m.queueId)}
              className={`flex items-center gap-1.5 rounded-t px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {meta.short}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {m.totalGames >= 1000 ? `${(m.totalGames / 1000).toFixed(1)}k` : m.totalGames}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mode content */}
      <div className="space-y-6 rounded-xl border border-border bg-card p-5">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <p
                className={`text-xl font-bold ${
                  active.winRate === null
                    ? "text-muted-foreground"
                    : active.winRate > 0.52
                      ? "text-green-400"
                      : active.winRate < 0.48
                        ? "text-red-400"
                        : "text-foreground"
                }`}
              >
                {active.winRate !== null ? `${(active.winRate * 100).toFixed(1)}%` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Games</p>
              <p className="text-xl font-bold text-foreground">
                {active.totalGames.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Role selector for ranked modes */}
          {roleOptions.length > 0 && (
            <div className="flex gap-1">
              {roleOptions.map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    activeRole === role
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {ROLE_LABELS[role] ?? role}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ARAM balance adjustments */}
        {active.queueId === 450 && aramModifiers && (
          <AramBalanceSection modifiers={aramModifiers} />
        )}

        {/* Popular items */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Popular Items
          </h3>
          <ItemGrid items={filteredItems} version={version} />
        </div>
      </div>
    </div>
  );
}
