import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  reactCompiler: true,
  cacheComponents: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
    browserToTerminal: true,
  },

  experimental: {
    staleTimes: { static: 180, dynamic: 30 },
    // Enables cross-document View Transitions for MPA-style page navigations.
    // Progressive enhancement — gated at the browser level via
    // @supports (view-transition-name: none) in CSS.
    viewTransition: true,
    scrollRestoration: true,
  },
};

export default nextConfig;
