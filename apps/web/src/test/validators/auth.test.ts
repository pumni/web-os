import { describe, it, expect } from 'vitest';
import { signInSchema, signUpSchema } from '@pumni/validators';

describe('Auth Validators', () => {
  describe('signInSchema', () => {
    it('should validate valid input', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = signInSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('signUpSchema', () => {
    it('should validate valid input', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
      });
      expect(result.success).toBe(true);
    });
  });
});
