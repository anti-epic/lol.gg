"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const links = [{ href: "/champions", label: "Champions" }];

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

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [region, setRegion] = useState("na1");
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || !trimmed.includes("#")) return;
    setQuery("");
    router.push(`/summoner/${region}/${encodeURIComponent(trimmed)}`);
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
            placeholder="GameName#Tag"
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
