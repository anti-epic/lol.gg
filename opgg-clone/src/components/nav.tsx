"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const links = [{ href: "/champions", label: "Champions" }];

const REGIONS = [
  { value: "na1", label: "NA", defaultTag: "NA1" },
  { value: "euw1", label: "EUW", defaultTag: "EUW" },
  { value: "kr", label: "KR", defaultTag: "KR1" },
  { value: "eun1", label: "EUNE", defaultTag: "EUNE" },
  { value: "jp1", label: "JP", defaultTag: "JP1" },
  { value: "br1", label: "BR", defaultTag: "BR1" },
  { value: "la1", label: "LAN", defaultTag: "LA1" },
  { value: "la2", label: "LAS", defaultTag: "LA2" },
  { value: "oc1", label: "OCE", defaultTag: "OC1" },
  { value: "tr1", label: "TR", defaultTag: "TR1" },
  { value: "ru", label: "RU", defaultTag: "RU1" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [region, setRegion] = useState("na1");
  const [query, setQuery] = useState("");

  const defaultTag = REGIONS.find((r) => r.value === region)?.defaultTag ?? "NA1";

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    const riotId = trimmed.includes("#") ? trimmed : `${trimmed}#${defaultTag}`;
    setQuery("");
    router.push(`/summoner/${region}/${encodeURIComponent(riotId)}`);
  }

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{
        background: "rgba(1,10,19,0.92)",
        borderBottom: "1px solid rgba(200,155,60,0.18)",
      }}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link href="/" className="lol-shimmer-text shrink-0 text-xl font-black">
          lol.gg
        </Link>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="flex flex-1 max-w-sm overflow-hidden rounded"
          style={{
            border: "1px solid rgba(200,155,60,0.2)",
            background: "#0A1628",
          }}
        >
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-transparent px-2 py-1.5 text-xs font-bold cursor-pointer focus:outline-none"
            style={{
              borderRight: "1px solid rgba(200,155,60,0.2)",
              color: "#C89B3C",
            }}
            aria-label="Region"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value} style={{ background: "#0A1628" }}>
                {r.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Summoner name"
            className="flex-1 bg-transparent px-3 py-1.5 text-sm focus:outline-none"
            style={{ color: "#F0E6D3" }}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="px-3 text-sm font-bold transition-colors focus-visible:outline-none"
            style={{ color: "rgba(200,155,60,0.6)" }}
            aria-label="Search"
          >
            ↵
          </button>
        </form>

        {/* Nav links */}
        <ul className="flex items-center gap-5 shrink-0" role="list">
          {links.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm font-semibold transition-colors"
                  style={{
                    color: isActive ? "#C89B3C" : "rgba(240,230,211,0.45)",
                  }}
                  aria-current={isActive ? "page" : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
