"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <h1 className="text-2xl font-bold">Sentry Test Page</h1>
      <p className="text-muted-foreground">Delete this page after confirming Sentry works.</p>
      <div className="flex gap-3">
        <button
          onClick={() => Sentry.captureMessage("Sentry is working! ✅")}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Send test message
        </button>
        <button
          onClick={() => {
            throw new Error("Test error from client");
          }}
          className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground"
        >
          Throw test error
        </button>
      </div>
    </main>
  );
}
