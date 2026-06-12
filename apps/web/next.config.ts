import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  reactCompiler: true,
  cacheComponents: true,
  experimental: {
    staleTimes: { static: 180, dynamic: 30 },
  },
};

export default nextConfig;
