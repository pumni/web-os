import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { Button } from '@pumni/ui/form';
import './globals.css';

// global-not-found renders OUTSIDE the root layout (experimental.globalNotFound),
// so it owns the full document: <html>/<body> + font variables, mirroring
// layout.tsx. Theme providers are absent here; :root design tokens still apply.
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '404 — Page Not Found',
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground"
      >
        <h1 className="text-2xl font-bold">404 — Page Not Found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </body>
    </html>
  );
}
