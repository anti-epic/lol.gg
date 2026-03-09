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
    // Auto-append default regional tag if the user didn't include one
    const riotId = trimmed.includes("#") ? trimmed : `${trimmed}#${defaultTag}`;
    setQuery("");
    router.push(`/summoner/${region}/${encodeURIComponent(riotId)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <nav
        className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 text-lg font-bold text-foreground transition-colors hover:text-primary"
        >
          lol.gg
        </Link>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="flex flex-1 max-w-sm overflow-hidden rounded-lg border border-border bg-muted"
        >
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="border-r border-border bg-muted px-2 py-1.5 text-xs font-medium text-foreground focus:outline-none"
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Summoner name"
            className="flex-1 bg-transparent px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="px-3 text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none"
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
                  className={
                    isActive
                      ? "text-sm font-semibold text-foreground"
                      : "text-sm text-muted-foreground transition-colors hover:text-foreground"
                  }
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
