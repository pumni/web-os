import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  reactCompiler: true,
  cacheComponents: true,
  serverExternalPackages: ['@supabase/supabase-js'],
  logging: {
    fetches: process.env.NODE_ENV === 'development' ? { fullUrl: true } : undefined,
    browserToTerminal: process.env.NODE_ENV !== 'production',
  },

  experimental: {
    inlineCss: true,
    // Enables cross-document View Transitions for MPA-style page navigations.
    // Progressive enhancement — gated at the browser level via
    // @supports (view-transition-name: none) in CSS.
    viewTransition: true,
    scrollRestoration: true,
    optimizePackageImports: [
      '@vidstack/react',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

