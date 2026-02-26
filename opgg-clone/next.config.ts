import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  webpack: (config) => {
    return config;
  },
  // Ensure app router works properly on Vercel
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

// Only wrap with Sentry when a DSN is configured
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG ?? "",
      project: process.env.SENTRY_PROJECT ?? "",
      // Suppress noisy build output unless in CI
      silent: !process.env.CI,
      // Upload source maps for readable stack traces in Sentry
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : nextConfig;
