import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  typedRoutes: true,
  reactCompiler: true,
  cacheComponents: true,
  serverExternalPackages: ['@supabase/supabase-js'],
  logging: {
    fetches: isDev ? { fullUrl: true } : undefined,
    browserToTerminal: isDev,
  },

  experimental: {
    inlineCss: true,
    // Enables cross-document View Transitions for MPA-style page navigations.
    // Progressive enhancement — gated at the browser level via
    // @supports (view-transition-name: none) in CSS.
    viewTransition: true,
    scrollRestoration: true,
    // Single root-level 404 for unmatched URLs across all route groups
    // ((app)/(public)/(watch)). Pairs with app/global-not-found.tsx.
    globalNotFound: true,
    // lucide-react is in Next's built-in default optimizePackageImports list
    // (since 13.5) — listing it here is redundant. Only non-default barrel
    // packages need explicit entries.
    optimizePackageImports: [
      '@vidstack/react',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      // Barrel packages used across @pumni/ui — not in Next's default list,
      // so the tree-shake transform must be opted in explicitly.
      'radix-ui',
      'motion',
    ],
  },

  async headers() {
    let supabaseHost = '';
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host;
      }
    } catch {
      // Ignore
    }

    // Realtime + REST origin. Prefer the exact configured host; fall back to the
    // Supabase wildcard only when the URL is unavailable at build time.
    const supabaseConnect = supabaseHost
      ? `https://${supabaseHost} wss://${supabaseHost}`
      : 'https://*.supabase.co wss://*.supabase.co';

    // 'unsafe-inline' stays for scripts/styles because Next injects inline
    // bootstrap scripts and `inlineCss` emits inline <style>. A nonce would be
    // stricter but forces per-request dynamic rendering, defeating
    // `cacheComponents` (PPR). 'unsafe-eval' and the local dev origins are
    // gated to development only so production stays tight.
    const scriptSrc = ["'self'", "'unsafe-inline'", isDev && "'unsafe-eval'"]
      .filter(Boolean)
      .join(' ');

    const connectSrc = ["'self'", supabaseConnect, isDev && 'ws: http://localhost:54321']
      .filter(Boolean)
      .join(' ');

    const cspHeader = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https://*.supabase.co",
      "font-src 'self' data:",
      `connect-src ${connectSrc}`,
      "media-src 'self' blob: data:",
      "object-src 'none'",
      "frame-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
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
