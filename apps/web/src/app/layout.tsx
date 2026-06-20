import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { PersonalizationProvider, PersonalizationScript, Toaster } from '@pumni/ui';
import { TelemetryProvider } from '@/lib/observability';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    template: '%s | Pumni Web OS',
    default: 'Pumni Web OS',
  },
  description:
    'A modern, reusable SaaS Starter base with Next.js App Router, Bun workspaces, and Supabase SSR.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground"
      >
        {/* Swallow Vidstack's benign "provider destroyed" promise rejection (fired
            when the media provider is torn down mid-load: React StrictMode
            double-mount in dev, or a legitimate source swap). Capture-phase +
            earliest registration so it runs before Next's dev error-overlay
            listener and stops it from surfacing a false runtime error. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){if(typeof window==='undefined')return;window.addEventListener('unhandledrejection',function(e){var r=e.reason;var m=typeof r==='string'?r:(r&&r.message);if(m==='provider destroyed'){e.stopImmediatePropagation();e.preventDefault();}},true);})();",
          }}
        />
        {/* Pre-paint: reflect stored accent/glass onto <html> before first paint (no FOUC). */}
        <PersonalizationScript />
        <ThemeProvider>
          <PersonalizationProvider>
            {/* Vendor-neutral observability seam (ADR-0011). No-op by default;
                a consuming project injects a real sink via the `telemetry` prop. */}
            <TelemetryProvider>
              <QueryProvider>
                {children}
                <Toaster />
              </QueryProvider>
            </TelemetryProvider>
          </PersonalizationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
