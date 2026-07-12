import 'server-only';
import { Polar } from '@polar-sh/sdk';
import { serverEnv } from '@pumni/env/server';
import type { Tier, Interval } from './types';

let polarClient: Polar | null = null;

export function getPolarClient(): Polar {
  if (polarClient) {
    return polarClient;
  }

  const accessToken = serverEnv.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('POLAR_ACCESS_TOKEN environment variable is missing.');
  }

  polarClient = new Polar({
    accessToken,
    server: serverEnv.POLAR_SERVER,
  });

  return polarClient;
}

export function productIdFor(tier: 'pro' | 'max', interval: Interval): string {
  let productId: string | undefined;

  if (tier === 'pro') {
    productId = interval === 'monthly' ? serverEnv.POLAR_PRODUCT_PRO_MONTHLY : serverEnv.POLAR_PRODUCT_PRO_YEARLY;
  } else if (tier === 'max') {
    productId = interval === 'monthly' ? serverEnv.POLAR_PRODUCT_MAX_MONTHLY : serverEnv.POLAR_PRODUCT_MAX_YEARLY;
  }

  if (!productId) {
    throw new Error(`Polar product ID for tier "${tier}" and interval "${interval}" is not configured.`);
  }

  return productId;
}

export function tierForProductId(productId: string): Tier | null {
  if (
    (serverEnv.POLAR_PRODUCT_PRO_MONTHLY && productId === serverEnv.POLAR_PRODUCT_PRO_MONTHLY) ||
    (serverEnv.POLAR_PRODUCT_PRO_YEARLY && productId === serverEnv.POLAR_PRODUCT_PRO_YEARLY)
  ) {
    return 'pro';
  }
  if (
    (serverEnv.POLAR_PRODUCT_MAX_MONTHLY && productId === serverEnv.POLAR_PRODUCT_MAX_MONTHLY) ||
    (serverEnv.POLAR_PRODUCT_MAX_YEARLY && productId === serverEnv.POLAR_PRODUCT_MAX_YEARLY)
  ) {
    return 'max';
  }
  return null;
}
