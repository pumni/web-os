import { describe, it, expect } from 'vitest';
import { checkoutSchema } from '@pumni/validators';

describe('Billing Validator', () => {
  it('should validate valid checkout data', () => {
    const proMonthly = checkoutSchema.safeParse({
      tier: 'pro',
      interval: 'monthly',
    });
    expect(proMonthly.success).toBe(true);

    const maxYearly = checkoutSchema.safeParse({
      tier: 'max',
      interval: 'yearly',
    });
    expect(maxYearly.success).toBe(true);
  });

  it('should reject invalid tiers', () => {
    const result = checkoutSchema.safeParse({
      tier: 'free',
      interval: 'monthly',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid intervals', () => {
    const result = checkoutSchema.safeParse({
      tier: 'pro',
      interval: 'daily',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing fields', () => {
    const result = checkoutSchema.safeParse({
      tier: 'pro',
    });
    expect(result.success).toBe(false);
  });
});
