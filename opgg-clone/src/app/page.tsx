"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const REGIONS = [
  { value: "na1", label: "NA" },
  { value: "euw1", label: "EUW" },
  { value: "kr", label: "KR" },
  { value: "eun1", label: "EUNE" },
  { value: "jp1", label: "JP" },
  { value: "br1", label: "BR" },
  { value: "la1", label: "LAN" },
  { value: "la2", label: "LAS" },
  { value: "oc1", label: "OCE" },
  { value: "tr1", label: "TR" },
  { value: "ru", label: "RU" },
];

export default function Home() {
  const router = useRouter();
  const [region, setRegion] = useState("na1");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!trimmed.includes("#")) {
      setError("Use Riot ID format: GameName#Tag (e.g. Faker#KR1)");
      return;
    }
    setError("");
    router.push(`/summoner/${region}/${encodeURIComponent(trimmed)}`);
  }

  return (
    <main
      id="main-content"
      className="flex min-h-[80vh] flex-col items-center justify-center gap-10 px-4"
    >
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground">lol.gg</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          League of Legends stats, builds, and match history
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-3">
        <div className="flex overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="border-r border-border bg-muted px-3 py-3 text-sm font-medium text-foreground focus:outline-none"
            aria-label="Region"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            placeholder="GameName#Tag"
            className="flex-1 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Search
          </button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>

      {/* Quick links */}
      <p className="text-sm text-muted-foreground">
        Or browse{" "}
        <Link href="/champions" className="font-medium text-foreground hover:underline">
          Champions
        </Link>
      </p>
    </main>
  );
}
