// Sentry is only loaded in production to prevent its webpack runtime patches
// from interfering with Next.js 16 RSC client reference resolution in dev.
// (The patches expect the Sentry webpack plugin to have instrumented components,
// which we only do in production builds via withSentryConfig.)

export const onRouterTransitionStart =
  process.env.NODE_ENV === "production"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require("@sentry/nextjs") as typeof import("@sentry/nextjs")).captureRouterTransitionStart
    : undefined;

if (process.env.NODE_ENV === "production") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sentry = require("@sentry/nextjs") as typeof import("@sentry/nextjs");
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    debug: false,
  });
}
