import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Z-index layering guard.
 *
 * Verifies that the `tokens.css` z-index scale maintains the correct semantic
 * ordering so that:
 *   - Floating overlay *content* (popover/menu/select) sits ABOVE modal panels.
 *   - Tooltip sits ABOVE popovers/command but BELOW toast.
 *   - Scrim (`--z-overlay`) stays BELOW all content layers.
 *
 * Without this test the §1 bug (menus hidden behind dialogs) could silently
 * regress — it was not caught for exactly this reason.
 */
const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../../..");
const tokenCss = readFileSync(
  path.join(repoRoot, "packages/ui/src/styles/tokens.css"),
  "utf8",
);

function readZIndex(name: string): number {
  const match = tokenCss.match(new RegExp(`${name}:\\s*(-?\\d+)`));
  if (!match?.[1]) throw new Error(`Missing z-index token: ${name}`);
  return Number(match[1]);
}

describe("z-index layering scale — semantic ordering", () => {
  it("reads all required tokens without throwing", () => {
    // Smoke: all tokens must be present
    expect(() => readZIndex("--z-desktop")).not.toThrow();
    expect(() => readZIndex("--z-base")).not.toThrow();
    expect(() => readZIndex("--z-window")).not.toThrow();
    expect(() => readZIndex("--z-window-active")).not.toThrow();
    expect(() => readZIndex("--z-sidebar")).not.toThrow();
    expect(() => readZIndex("--z-dock")).not.toThrow();
    expect(() => readZIndex("--z-topbar")).not.toThrow();
    expect(() => readZIndex("--z-overlay")).not.toThrow();
    expect(() => readZIndex("--z-modal")).not.toThrow();
    expect(() => readZIndex("--z-popover")).not.toThrow();
    expect(() => readZIndex("--z-command")).not.toThrow();
    expect(() => readZIndex("--z-tooltip")).not.toThrow();
    expect(() => readZIndex("--z-toast")).not.toThrow();
  });

  it("maintains a strictly ascending order (desktop → toast)", () => {
    const zDesktop = readZIndex("--z-desktop"); // -1
    const zBase = readZIndex("--z-base"); // 0
    const zWindow = readZIndex("--z-window"); // 100
    const zWindowActive = readZIndex("--z-window-active"); // 110
    const zSidebar = readZIndex("--z-sidebar"); // 700
    const zDock = readZIndex("--z-dock"); // 800
    const zTopbar = readZIndex("--z-topbar"); // 850
    const zOverlay = readZIndex("--z-overlay"); // 900
    const zModal = readZIndex("--z-modal"); // 1000
    const zPopover = readZIndex("--z-popover"); // 1050
    const zCommand = readZIndex("--z-command"); // 1100
    const zTooltip = readZIndex("--z-tooltip"); // 1150
    const zToast = readZIndex("--z-toast"); // 1200

    expect(zDesktop).toBeLessThan(zBase);
    expect(zBase).toBeLessThan(zWindow);
    expect(zWindow).toBeLessThan(zWindowActive);
    expect(zWindowActive).toBeLessThan(zSidebar);
    expect(zSidebar).toBeLessThan(zDock);
    expect(zDock).toBeLessThan(zTopbar);
    expect(zTopbar).toBeLessThan(zOverlay);
    expect(zOverlay).toBeLessThan(zModal);
    expect(zModal).toBeLessThan(zPopover);
    expect(zPopover).toBeLessThan(zCommand);
    expect(zCommand).toBeLessThan(zTooltip);
    expect(zTooltip).toBeLessThan(zToast);
  });

  it("popover content renders ABOVE modal panel (the §1 bug regression)", () => {
    const zModal = readZIndex("--z-modal");
    const zPopover = readZIndex("--z-popover");
    // Menus/selects inside a Dialog must never be hidden behind the dialog panel
    expect(zPopover).toBeGreaterThan(zModal);
  });

  it("tooltip renders ABOVE popover content and command palette", () => {
    const zPopover = readZIndex("--z-popover");
    const zCommand = readZIndex("--z-command");
    const zTooltip = readZIndex("--z-tooltip");
    expect(zTooltip).toBeGreaterThan(zPopover);
    expect(zTooltip).toBeGreaterThan(zCommand);
  });

  it("tooltip renders BELOW toast (toast is always frontmost)", () => {
    const zTooltip = readZIndex("--z-tooltip");
    const zToast = readZIndex("--z-toast");
    expect(zTooltip).toBeLessThan(zToast);
  });

  it("scrim (z-overlay) is BELOW modal panel — never content", () => {
    const zOverlay = readZIndex("--z-overlay");
    const zModal = readZIndex("--z-modal");
    const zPopover = readZIndex("--z-popover");
    const zTooltip = readZIndex("--z-tooltip");
    // Scrim must be strictly below all floating content layers
    expect(zOverlay).toBeLessThan(zModal);
    expect(zOverlay).toBeLessThan(zPopover);
    expect(zOverlay).toBeLessThan(zTooltip);
  });

  it("state-layer tokens are present in tokens.css", () => {
    const matchHover = tokenCss.match(/--state-hover:\s*(\d+)%/);
    const matchPressed = tokenCss.match(/--state-pressed:\s*(\d+)%/);
    const matchSelected = tokenCss.match(/--state-selected:\s*(\d+)%/);
    expect(matchHover?.[1]).toBeDefined();
    expect(matchPressed?.[1]).toBeDefined();
    expect(matchSelected?.[1]).toBeDefined();
    // Pressed must be stronger than hover
    expect(Number(matchPressed![1])).toBeGreaterThan(Number(matchHover![1]));
  });
});
