import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Octo is a live, client-state dashboard: every screen reads "now", so the
  // app renders on demand instead of caching prerendered HTML.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
