"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

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

export function HeroSearch() {
  const router = useRouter();
  const [region, setRegion] = useState("na1");
  const [name, setName] = useState("");

  const defaultTag = REGIONS.find((r) => r.value === region)?.defaultTag ?? "NA1";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const riotId = trimmed.includes("#") ? trimmed : `${trimmed}#${defaultTag}`;
    router.push(`/summoner/${region}/${encodeURIComponent(riotId)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="lol-fade-up-3 w-full max-w-xl">
      {/* Gold border container with glow */}
      <div
        className="lol-glow relative overflow-hidden rounded-lg"
        style={{
          background: "linear-gradient(135deg, #C89B3C 0%, #785A28 50%, #C89B3C 100%)",
          padding: "1px",
        }}
      >
        <div className="flex overflow-hidden rounded-[7px] bg-[#010A13]">
          {/* Region selector */}
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="border-r border-[#C89B3C]/30 bg-[#0A1628] px-3 py-4 text-sm font-bold text-[#C89B3C] focus:outline-none cursor-pointer"
            aria-label="Region"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value} className="bg-[#0A1628]">
                {r.label}
              </option>
            ))}
          </select>

          {/* Text input */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Summoner name or GameName#${defaultTag}`}
            className="flex-1 bg-transparent px-5 py-4 text-sm text-[#F0E6D3] placeholder:text-[#F0E6D3]/30 focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Search button */}
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-4 text-sm font-bold text-[#010A13] transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #C89B3C, #F0E6D3 50%, #C89B3C)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #F0E6D3, #C89B3C 50%, #F0E6D3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #C89B3C, #F0E6D3 50%, #C89B3C)";
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Search
          </button>
        </div>
      </div>
    </form>
  );
}
