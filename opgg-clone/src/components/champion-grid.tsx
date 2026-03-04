"use client";

import { useState } from "react";
import { ChampionCard } from "@/components/champion-card";
import { type DDragonChampion } from "@/lib/ddragon";

interface ChampionGridProps {
  champions: DDragonChampion[];
  version: string;
}

export function ChampionGrid({ champions, version }: ChampionGridProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? champions.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : champions;

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search champions..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Search champions"
      />
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No champions found for &ldquo;{query}&rdquo;
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
          {filtered.map((champion) => (
            <ChampionCard key={champion.id} champion={champion} version={version} />
          ))}
        </div>
      )}
    </div>
  );
}
