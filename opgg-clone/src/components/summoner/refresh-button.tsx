"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";

interface Props {
  puuid: string;
  region: string;
}

export function RefreshButton({ puuid, region }: Props) {
  const router = useRouter();
  const refresh = trpc.summoner.refresh.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <button
      onClick={() => refresh.mutate({ puuid, region })}
      disabled={refresh.isPending}
      title="Fetch latest data from Riot"
      className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
    >
      <span className={refresh.isPending ? "animate-spin" : ""} aria-hidden="true">
        ↺
      </span>
      {refresh.isPending ? "Refreshing…" : "Refresh"}
    </button>
  );
}
