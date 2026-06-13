import { describe, it, expect } from "vitest";
import { extractStoragePath } from "../../features/profile/utils";

describe("Profile Utils - extractStoragePath", () => {
  it("should correctly extract storage path from a valid Supabase storage URL", () => {
    const url = "https://xyz.supabase.co/storage/v1/object/public/avatars/user-123/avatar-456.jpg";
    const path = extractStoragePath(url);
    expect(path).toBe("user-123/avatar-456.jpg");
  });

  it("should return null if the URL does not contain the avatars bucket marker", () => {
    const url = "https://example.com/some/other/path/avatar.jpg";
    const path = extractStoragePath(url);
    expect(path).toBeNull();
  });

  it("should handle empty or invalid inputs gracefully", () => {
    expect(extractStoragePath("")).toBeNull();
  });
});
