import { describe, it, expect } from "vitest";
import { fractionalPosition } from "../../features/watch/sync-math";

describe("reorder fractionalPosition semantics", () => {
  it("đưa lên đầu (before=null)", () => {
    expect(fractionalPosition(null, 0)).toBe(-1); // trước item đầu
  });
  it("đưa xuống cuối (after=null)", () => {
    expect(fractionalPosition(2, null)).toBe(3); // sau item cuối
  });
  it("chèn vào giữa", () => {
    expect(fractionalPosition(1, 2)).toBe(1.5);
  });
  it("list rỗng", () => {
    expect(fractionalPosition(null, null)).toBe(0);
  });
});
