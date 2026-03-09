import Image from "next/image";
import Link from "next/link";
import {
  getAllChampions,
  getDDragonVersion,
  championLoadingUrl,
  championIconUrl,
  type DDragonChampion,
} from "@/lib/ddragon";
import { HeroSearch } from "@/components/home/hero-search";

// Iconic champions for the showcase strip — visually varied silhouettes
const SHOWCASE_KEYS = ["Ahri", "Jinx", "Thresh", "Yasuo", "Lux", "Zed", "Vi", "Graves"];

// Hero background champions — dramatic contrast
const HERO_LEFT_KEY = "Thresh";
const HERO_RIGHT_KEY = "Ahri";

export default async function Home() {
  const [version, allChampions] = await Promise.all([getDDragonVersion(), getAllChampions()]);

  const patch = version.split(".").slice(0, 2).join(".");
  const championCount = Object.keys(allChampions).length;

  const showcaseChampions = SHOWCASE_KEYS.map((k) => allChampions[k]).filter(
    (c): c is DDragonChampion => Boolean(c)
  );
  const heroLeft = allChampions[HERO_LEFT_KEY];
  const heroRight = allChampions[HERO_RIGHT_KEY];

  return (
    <main id="main-content" className="overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{ background: "#010A13" }}
      >
        {/* ── Multi-layer background ── */}

        {/* Deep radial glow from top-center */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(11,38,98,0.55) 0%, transparent 70%)",
          }}
        />
        {/* Subtle gold warmth from bottom */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 110%, rgba(200,155,60,0.08) 0%, transparent 70%)",
          }}
        />

        {/* ── Subtle hex grid texture ── */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='92' viewBox='0 0 80 92' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 4L76 24V64L40 84L4 64V24L40 4Z' stroke='%23C89B3C' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: "80px 92px",
          }}
        />

        {/* ── Left champion (Thresh) ── */}
        {heroLeft && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[38%] overflow-hidden">
            <Image
              src={championLoadingUrl(heroLeft.id)}
              alt=""
              fill
              className="object-cover object-top"
              priority
              style={{
                maskImage:
                  "linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.08) 65%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.08) 65%, transparent 100%)",
                filter: "saturate(0.7) brightness(0.6)",
              }}
            />
            {/* Vertical edge fade */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to right, rgba(1,10,19,0.7) 0%, transparent 60%)",
              }}
            />
          </div>
        )}

        {/* ── Right champion (Ahri) ── */}
        {heroRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[38%] overflow-hidden">
            <Image
              src={championLoadingUrl(heroRight.id)}
              alt=""
              fill
              className="object-cover object-[right_top]"
              priority
              style={{
                maskImage:
                  "linear-gradient(to left, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.1) 65%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to left, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.1) 65%, transparent 100%)",
                filter: "saturate(0.8) brightness(0.55)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to left, rgba(1,10,19,0.7) 0%, transparent 60%)",
              }}
            />
          </div>
        )}

        {/* ── Center vignette so text is always readable ── */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 70% at 50% 50%, transparent 30%, rgba(1,10,19,0.6) 100%)",
          }}
        />

        {/* ── Hero content ── */}
        <div className="relative z-10 flex flex-col items-center gap-7 px-6 text-center">
          {/* Top decorative rule */}
          <div className="lol-fade-up-1 flex items-center gap-4">
            <div
              className="h-px w-20"
              style={{ background: "linear-gradient(to right, transparent, #C89B3C)" }}
            />
            <svg width="10" height="10" viewBox="0 0 10 10" fill="#C89B3C">
              <rect x="0" y="4" width="10" height="2" />
              <rect x="4" y="0" width="2" height="10" />
            </svg>
            <span
              className="text-[11px] font-bold uppercase tracking-[0.35em]"
              style={{ color: "#C89B3C" }}
            >
              League of Legends
            </span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="#C89B3C">
              <rect x="0" y="4" width="10" height="2" />
              <rect x="4" y="0" width="2" height="10" />
            </svg>
            <div
              className="h-px w-20"
              style={{ background: "linear-gradient(to left, transparent, #C89B3C)" }}
            />
          </div>

          {/* Logo */}
          <div className="lol-float lol-fade-up-2 flex flex-col items-center gap-1">
            <h1 className="lol-shimmer-text text-[5.5rem] font-black leading-none tracking-tight sm:text-[7rem]">
              lol.gg
            </h1>
            <p
              className="text-xs font-semibold uppercase tracking-[0.5em]"
              style={{ color: "rgba(240,230,211,0.45)" }}
            >
              Stats · Builds · History
            </p>
          </div>

          {/* Diamond divider */}
          <div className="lol-fade-up-2 flex items-center gap-3">
            <div
              className="h-px w-28"
              style={{ background: "linear-gradient(to right, transparent, rgba(200,155,60,0.5))" }}
            />
            <svg width="12" height="12" viewBox="0 0 12 12" fill="#C89B3C" style={{ opacity: 0.8 }}>
              <polygon points="6,0 12,6 6,12 0,6" />
            </svg>
            <div
              className="h-px w-28"
              style={{ background: "linear-gradient(to left, transparent, rgba(200,155,60,0.5))" }}
            />
          </div>

          {/* Search */}
          <HeroSearch />

          {/* Browse champions link */}
          <p className="lol-fade-up-4 text-sm" style={{ color: "rgba(240,230,211,0.35)" }}>
            Or{" "}
            <Link
              href="/champions"
              className="lol-link-gold font-semibold hover:underline underline-offset-4"
            >
              explore champion builds
            </Link>
          </p>
        </div>

        {/* ── Bottom fade-out ── */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-40"
          style={{ background: "linear-gradient(to top, #010A13, transparent)" }}
        />

        {/* ── Scroll indicator ── */}
        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 opacity-40">
          <div
            className="h-10 w-px"
            style={{ background: "linear-gradient(to bottom, #C89B3C, transparent)" }}
          />
          <svg width="8" height="8" viewBox="0 0 8 8" fill="#C89B3C">
            <polygon points="4,8 0,0 8,0" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS STRIP
      ═══════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "#0A1628",
          borderTop: "1px solid rgba(200,155,60,0.2)",
          borderBottom: "1px solid rgba(200,155,60,0.2)",
        }}
      >
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-16 gap-y-4 px-8 py-6">
          {[
            { value: `Patch ${patch}`, label: "Current Patch" },
            { value: "11", label: "Regions" },
            { value: `${championCount}`, label: "Champions" },
            { value: "8", label: "Game Modes" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-black" style={{ color: "#C89B3C" }}>
                {s.value}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-[0.25em]"
                style={{ color: "rgba(240,230,211,0.35)" }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CHAMPION SPOTLIGHT
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ background: "#010A13" }} className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          {/* Section header */}
          <div className="mb-10 flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
              <div
                className="h-px w-16"
                style={{
                  background: "linear-gradient(to right, transparent, rgba(200,155,60,0.5))",
                }}
              />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.35em]"
                style={{ color: "#C89B3C" }}
              >
                Champion Spotlight
              </span>
              <div
                className="h-px w-16"
                style={{
                  background: "linear-gradient(to left, transparent, rgba(200,155,60,0.5))",
                }}
              />
            </div>
            <p className="text-sm" style={{ color: "rgba(240,230,211,0.45)" }}>
              Builds, win rates, and tier data for every champion across all game modes
            </p>
          </div>

          {/* Champion grid */}
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {showcaseChampions.map((champ) => (
              <Link
                key={champ.id}
                href={`/champions/${champ.id}`}
                className="group lol-card-hover relative aspect-[5/8] overflow-hidden rounded-lg"
                style={{ border: "1px solid rgba(30,35,40,1)" }}
              >
                <Image
                  src={championLoadingUrl(champ.id)}
                  alt={champ.name}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.06]"
                />
                {/* Permanent dark gradient at bottom */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(1,10,19,0.95) 0%, rgba(1,10,19,0.3) 50%, transparent 100%)",
                  }}
                />
                {/* Gold sheen on hover */}
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "rgba(200,155,60,0.06)" }}
                />
                {/* Corner brackets on hover */}
                <div
                  className="absolute left-1 top-1 h-3 w-px opacity-0 transition-all duration-300 group-hover:opacity-100"
                  style={{ background: "#C89B3C" }}
                />
                <div
                  className="absolute left-1 top-1 h-px w-3 opacity-0 transition-all duration-300 group-hover:opacity-100"
                  style={{ background: "#C89B3C" }}
                />
                <div
                  className="absolute bottom-1 right-1 h-3 w-px opacity-0 transition-all duration-300 group-hover:opacity-100"
                  style={{ background: "#C89B3C" }}
                />
                <div
                  className="absolute bottom-1 right-1 h-px w-3 opacity-0 transition-all duration-300 group-hover:opacity-100"
                  style={{ background: "#C89B3C" }}
                />
                {/* Name + role */}
                <div className="absolute bottom-0 left-0 right-0 translate-y-1 px-2 pb-2 transition-transform duration-300 group-hover:translate-y-0">
                  <p className="truncate text-[11px] font-black" style={{ color: "#F0E6D3" }}>
                    {champ.name}
                  </p>
                  <p
                    className="text-[9px] uppercase tracking-wider"
                    style={{ color: "rgba(200,155,60,0.7)" }}
                  >
                    {champ.tags[0]}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8 flex justify-center">
            <Link
              href="/champions"
              className="lol-btn-outline group flex items-center gap-2.5 px-7 py-3 text-sm font-bold"
            >
              View All {championCount} Champions
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "#0A1628",
          borderTop: "1px solid rgba(200,155,60,0.12)",
        }}
        className="py-20"
      >
        <div className="mx-auto max-w-5xl px-6">
          {/* Section header */}
          <div className="mb-12 flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
              <div
                className="h-px w-16"
                style={{
                  background: "linear-gradient(to right, transparent, rgba(200,155,60,0.5))",
                }}
              />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.35em]"
                style={{ color: "#C89B3C" }}
              >
                Everything You Need
              </span>
              <div
                className="h-px w-16"
                style={{
                  background: "linear-gradient(to left, transparent, rgba(200,155,60,0.5))",
                }}
              />
            </div>
            <p className="text-sm" style={{ color: "rgba(240,230,211,0.45)" }}>
              Tools to analyze, improve, and climb
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {/* Card 1 */}
            <div
              className="lol-card-hover group relative rounded-xl p-7"
              style={{
                background:
                  "linear-gradient(135deg, rgba(11,38,98,0.3) 0%, rgba(9,20,40,0.8) 100%)",
                border: "1px solid rgba(11,196,227,0.2)",
              }}
            >
              {/* Icon */}
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg"
                style={{
                  background: "rgba(11,196,227,0.1)",
                  border: "1px solid rgba(11,196,227,0.3)",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0BC4E3"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="8" r="5" />
                  <path d="M3 21c0-4.418 4.03-8 9-8s9 3.582 9 8" />
                </svg>
              </div>
              {/* Accent bar */}
              <div
                className="mb-4 h-px w-10 transition-all duration-300 group-hover:w-16"
                style={{ background: "#0BC4E3" }}
              />
              <h3 className="mb-2 text-base font-bold" style={{ color: "#F0E6D3" }}>
                Summoner Profiles
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(240,230,211,0.5)" }}>
                Full match history with KDA, champion stats, kill participation, and multi-kill
                badges. All 11 regions supported with live data refresh.
              </p>
            </div>

            {/* Card 2 — center, slightly elevated */}
            <div
              className="lol-card-hover group relative -mt-2 rounded-xl p-7"
              style={{
                background:
                  "linear-gradient(135deg, rgba(120,90,40,0.2) 0%, rgba(9,20,40,0.9) 100%)",
                border: "1px solid rgba(200,155,60,0.3)",
                boxShadow: "0 0 30px rgba(200,155,60,0.08)",
              }}
            >
              {/* "Most popular" badge */}
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest"
                style={{
                  background: "linear-gradient(90deg, #C89B3C, #F0E6D3 50%, #C89B3C)",
                  color: "#010A13",
                  borderRadius: "99px",
                  whiteSpace: "nowrap",
                }}
              >
                Core Feature
              </div>
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg"
                style={{
                  background: "rgba(200,155,60,0.1)",
                  border: "1px solid rgba(200,155,60,0.35)",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C89B3C"
                  strokeWidth="1.5"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <div
                className="mb-4 h-px w-10 transition-all duration-300 group-hover:w-16"
                style={{ background: "#C89B3C" }}
              />
              <h3 className="mb-2 text-base font-bold" style={{ color: "#F0E6D3" }}>
                Build Analytics
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(240,230,211,0.5)" }}>
                Item win rates aggregated from real matches across every game mode — Ranked, ARAM,
                Arena, URF. See what&#39;s actually working in the current meta.
              </p>
            </div>

            {/* Card 3 */}
            <div
              className="lol-card-hover group relative rounded-xl p-7"
              style={{
                background:
                  "linear-gradient(135deg, rgba(70,10,10,0.2) 0%, rgba(9,20,40,0.8) 100%)",
                border: "1px solid rgba(154,36,35,0.25)",
              }}
            >
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg"
                style={{
                  background: "rgba(154,36,35,0.12)",
                  border: "1px solid rgba(154,36,35,0.3)",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#E84057"
                  strokeWidth="1.5"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div
                className="mb-4 h-px w-10 transition-all duration-300 group-hover:w-16"
                style={{ background: "#E84057" }}
              />
              <h3 className="mb-2 text-base font-bold" style={{ color: "#F0E6D3" }}>
                Rank Tracking
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(240,230,211,0.5)" }}>
                Solo, Flex, and mode-specific stats with win rate breakdowns and champion mastery
                levels. Track your climb with ARAM balance adjustments shown per champion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          BOTTOM CTA
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-24"
        style={{ background: "#010A13", borderTop: "1px solid rgba(200,155,60,0.12)" }}
      >
        {/* Background glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(200,155,60,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Mini champion icons as decoration */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <div className="flex gap-4">
            {showcaseChampions.slice(0, 4).map((champ) => (
              <div key={champ.id} className="relative h-24 w-24 overflow-hidden rounded-full">
                <Image
                  src={championIconUrl(version, champ.id)}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
          <div className="flex items-center gap-4">
            <div
              className="h-px w-12"
              style={{ background: "linear-gradient(to right, transparent, rgba(200,155,60,0.4))" }}
            />
            <svg width="8" height="8" viewBox="0 0 8 8" fill="#C89B3C" opacity="0.6">
              <polygon points="4,0 8,4 4,8 0,4" />
            </svg>
            <div
              className="h-px w-12"
              style={{ background: "linear-gradient(to left, transparent, rgba(200,155,60,0.4))" }}
            />
          </div>
          <div>
            <h2 className="text-3xl font-black sm:text-4xl" style={{ color: "#F0E6D3" }}>
              Ready to climb?
            </h2>
            <p className="mt-2 text-sm" style={{ color: "rgba(240,230,211,0.4)" }}>
              Search your summoner and start analyzing
            </p>
          </div>
          <HeroSearch />
        </div>
      </section>
    </main>
  );
}
