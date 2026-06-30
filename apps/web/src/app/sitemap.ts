import type { MetadataRoute } from 'next';
import { cacheLife } from 'next/cache';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  'use cache';
  // Public route set is stable reference data; a GET sitemap is uncached by
  // default under cacheComponents, so opt in explicitly (>= 'minutes' per SSOT).
  cacheLife('hours');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const lastModified = new Date();

  return [
    { url: baseUrl, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/sign-in`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/sign-up`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
