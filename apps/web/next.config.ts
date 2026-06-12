import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  reactCompiler: true,
  cacheComponents: true,
  experimental: {
    staleTimes: { static: 180, dynamic: 30 },
    // `@pumni/ui` is a barrel package; this lets Next import only the used
    // components instead of pulling the whole module graph (smaller client
    // bundles, fewer accidental client boundaries, faster dev compile).
    optimizePackageImports: ["@pumni/ui"],
  },
};

export default nextConfig;
