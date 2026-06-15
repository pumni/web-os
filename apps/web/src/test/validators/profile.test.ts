import { describe, it, expect } from 'vitest';
import { profileSchema } from '@pumni/validators';

describe('Profile Validator', () => {
  it('should validate valid profile data', () => {
    const result = profileSchema.safeParse({
      username: 'john_doe',
      fullName: 'John Doe',
      avatarUrl: 'https://example.com/avatar.png',
    });
    expect(result.success).toBe(true);
  });

  it('should allow null fields', () => {
    const result = profileSchema.safeParse({
      username: null,
      fullName: null,
      avatarUrl: null,
    });
    expect(result.success).toBe(true);
  });

  it('should allow empty avatarUrl', () => {
    const result = profileSchema.safeParse({
      username: 'john_doe',
      fullName: 'John Doe',
      avatarUrl: '',
    });
    expect(result.success).toBe(true);
  });

  it('should reject short username', () => {
    const result = profileSchema.safeParse({
      username: 'jo',
      fullName: 'John Doe',
      avatarUrl: null,
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid character username', () => {
    const result = profileSchema.safeParse({
      username: 'john-doe', // contains hyphen, regex permits alphanumeric and underscore
      fullName: 'John Doe',
      avatarUrl: null,
    });
    expect(result.success).toBe(false);
  });
});
