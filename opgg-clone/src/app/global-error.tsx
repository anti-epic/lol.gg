"use client";

// global-error.tsx catches errors in the root layout itself.
// It must include its own <html> and <body> tags.
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center font-sans text-foreground antialiased">
        <h1 className="text-2xl font-bold">Something went critically wrong</h1>
        <p className="max-w-md text-muted-foreground">
          The application encountered a fatal error. Please refresh or try again.
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
