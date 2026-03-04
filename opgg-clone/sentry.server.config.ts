import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Server tracing disabled in dev — causes "Unexpected root span type" warnings
  // with Next.js 16's metadata resolution. Error capture via onRequestError still works.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  debug: false,
});
