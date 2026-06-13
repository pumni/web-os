import { describe, it, expect } from "vitest";
import { calculateExpectedPosition, extractYouTubeId, isValidHttpUrl } from "../../features/watch/sync-math";

describe("Watch synced playback math & helpers", () => {
  describe("calculateExpectedPosition", () => {
    it("should return static position when video is paused", () => {
      const anchor = {
        isPlaying: false,
        anchorPosition: 42.5,
        anchorServerTs: 100000,
        playbackRate: 1.0,
      };
      // Server clock moves forward but video is paused
      const expected = calculateExpectedPosition(anchor, 150000);
      expect(expected).toBe(42.5);
    });

    it("should calculate correct position when video is playing at 1x speed", () => {
      const anchor = {
        isPlaying: true,
        anchorPosition: 10.0,
        anchorServerTs: 100000, // epoch ms
        playbackRate: 1.0,
      };
      // 5 seconds pass (5000ms)
      const expected = calculateExpectedPosition(anchor, 105000);
      expect(expected).toBe(15.0);
    });

    it("should calculate correct position when video is playing at 1.5x speed", () => {
      const anchor = {
        isPlaying: true,
        anchorPosition: 20.0,
        anchorServerTs: 100000,
        playbackRate: 1.5,
      };
      // 10 seconds pass (10000ms) -> should advance by 10 * 1.5 = 15 seconds
      const expected = calculateExpectedPosition(anchor, 110000);
      expect(expected).toBe(35.0);
    });
  });

  describe("extractYouTubeId", () => {
    it("should parse 11-char ID directly", () => {
      expect(extractYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("should parse standard watch link", () => {
      expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("should parse shortened link", () => {
      expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("should parse embed link", () => {
      expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("should return null for invalid YouTube links", () => {
      expect(extractYouTubeId("https://youtube.com/invalid")).toBeNull();
      expect(extractYouTubeId("not-eleven-chars")).toBeNull();
    });
  });

  describe("isValidHttpUrl", () => {
    it("should accept valid http and https links", () => {
      expect(isValidHttpUrl("https://example.com/video.mp4")).toBe(true);
      expect(isValidHttpUrl("http://localhost/stream.m3u8")).toBe(true);
    });

    it("should reject invalid urls and protocols", () => {
      expect(isValidHttpUrl("ftp://example.com")).toBe(false);
      expect(isValidHttpUrl("not-a-link")).toBe(false);
    });
  });
});
