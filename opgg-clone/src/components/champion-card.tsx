import Image from "next/image";
import Link from "next/link";
import { type DDragonChampion, championIconUrl } from "@/lib/ddragon";

interface ChampionCardProps {
  champion: DDragonChampion;
  version: string;
}

export function ChampionCard({ champion, version }: ChampionCardProps) {
  return (
    <Link
      href={`/champions/${champion.id}`}
      role="article"
      aria-label={`${champion.name}, ${champion.title}`}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 hover:border-primary transition-colors"
    >
      <Image
        src={championIconUrl(version, champion.id)}
        alt={champion.name}
        width={56}
        height={56}
        className="rounded"
      />
      <span className="text-center text-xs font-medium text-foreground leading-tight">
        {champion.name}
      </span>
    </Link>
  );
}
