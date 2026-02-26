"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function SummonerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const isNotFound = error.message?.toLowerCase().includes("not found");

  return (
    <main
      id="main-content"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <h2 className="text-2xl font-bold text-foreground">
        {isNotFound ? "Summoner not found" : "Failed to load profile"}
      </h2>
      <p className="max-w-sm text-muted-foreground">
        {isNotFound
          ? "This summoner doesn't exist in this region. Check the name and region and try again."
          : "Something went wrong fetching this profile. The Riot API may be temporarily unavailable."}
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Back to search
        </Link>
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
