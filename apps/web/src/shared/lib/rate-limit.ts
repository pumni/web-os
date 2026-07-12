import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { serverEnv } from '@pumni/env/server';

export type Limiter = { limit(key: string): Promise<{ success: boolean; reset: number }> };

let activeLimiter: Limiter | null = null;
let hasWarned = false;

export function getLimiter(): Limiter {
  if (activeLimiter) {
    return activeLimiter;
  }

  const url = serverEnv.UPSTASH_REDIS_REST_URL;
  const token = serverEnv.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!hasWarned) {
      console.warn('Rate limiting disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. Failing open.');
      hasWarned = true;
    }
    return {
      limit: async () => ({ success: true, reset: Date.now() + 60000 }),
    };
  }

  const ratelimit = new Ratelimit({
    redis: new Redis({
      url,
      token,
    }),
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'pumni:ratelimit',
  });

  activeLimiter = {
    limit: async (key: string) => {
      const result = await ratelimit.limit(key);
      if (result.pending) {
        await result.pending;
      }
      return {
        success: result.success,
        reset: result.reset,
      };
    },
  };

  return activeLimiter;
}

/** Injectable for tests */
export function setLimiter(limiter: Limiter | null) {
  activeLimiter = limiter;
}

export async function withRateLimit<T>(key: string, fn: () => Promise<T>): Promise<T | { ok: false; message: string }> {
  const limiter = getLimiter();
  const { success } = await limiter.limit(key);
  if (!success) {
    return { ok: false, message: 'Vượt quá giới hạn thao tác, vui lòng thử lại sau.' };
  }
  return fn();
}

export async function limitOr429(key: string): Promise<Response | null> {
  const limiter = getLimiter();
  const { success, reset } = await limiter.limit(key);
  if (!success) {
    const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
    return new Response('Vượt quá giới hạn thao tác, vui lòng thử lại sau.', {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
  return null;
}
