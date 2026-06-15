import { describe, it, expect } from 'vitest';
import { createRoomSchema, setSourceSchema } from '@pumni/validators';

describe('Watch validators', () => {
  describe('createRoomSchema', () => {
    it('should accept valid YouTube inputs', () => {
      const result = createRoomSchema.safeParse({
        sourceType: 'youtube',
        sourceRef: 'dQw4w9WgXcQ',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid URL inputs', () => {
      const result = createRoomSchema.safeParse({
        sourceType: 'url',
        sourceRef: 'https://example.com/video.mp4',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty sourceRef', () => {
      const result = createRoomSchema.safeParse({
        sourceType: 'youtube',
        sourceRef: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('setSourceSchema', () => {
    it('should accept valid update inputs', () => {
      const result = setSourceSchema.safeParse({
        roomId: '00000000-0000-0000-0000-000000000000',
        sourceType: 'youtube',
        sourceRef: 'dQw4w9WgXcQ',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUIDs for roomId', () => {
      const result = setSourceSchema.safeParse({
        roomId: 'not-a-uuid',
        sourceType: 'youtube',
        sourceRef: 'dQw4w9WgXcQ',
      });
      expect(result.success).toBe(false);
    });
  });
});
