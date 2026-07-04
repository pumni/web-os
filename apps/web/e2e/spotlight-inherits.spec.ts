import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// This repro isolates the `@property --spot-x|y inherits` descriptor away from
// the rest of the app. It compares `inherits: false` vs `inherits: true` on two
// identical cards and asserts the radial gradient position only follows the
// cursor on the inheriting one. If this hypothesis is wrong the test fails and
// we must keep looking for the real cause.

const reproPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'spotlight-inherits-repro.html',
);

test.describe('CardSpotlight @property inherits regression', () => {
  test('the ::before radial-gradient only tracks the cursor when the custom property inherits', async ({
    page,
  }) => {
    const html = await readFile(reproPath, 'utf8');
    await page.setContent(html, { waitUntil: 'load' });
    await page.setViewportSize({ width: 800, height: 700 });

    // Move cursor to the top-left corner of each card and read the computed
    // `background-position` of the ::before layer. With a 200px circle, moving
    // the var from 50% to ~1% should produce a perceptibly different
    // background-position than the center-only fallback.
    async function bgPositionAt(cardId: string, x: number, y: number) {
      const box = page.locator(`#${cardId}`);
      const rect = (await box.boundingBox())!;
      await page.mouse.move(rect.x + x, rect.y + y);
      await page.waitForTimeout(120); // let any transition settle
      return box.evaluate((el) => {
        const before = window.getComputedStyle(el, '::before');
        return {
          bg: before.getPropertyValue('background'),
          x: before.getPropertyValue('background-position-x'),
          y: before.getPropertyValue('background-position-y'),
          pos: before.getPropertyValue('background-position'),
        };
      });
    }

    // For the non-inheriting card the var on the ::before box stays at its
    // initial 50% regardless of cursor position, so the gradient should be the
    // same whether the cursor is at the center or the corner.
    const falseCenter = await bgPositionAt('card-false', 150, 100);
    const falseCorner = await bgPositionAt('card-false', 5, 5);
    expect(falseCorner.bg).toBe(falseCenter.bg);

    // For the inheriting card the gradient must change when the cursor moves
    // from center to corner.
    const trueCenter = await bgPositionAt('card-true', 150, 100);
    const trueCorner = await bgPositionAt('card-true', 5, 5);
    expect(trueCorner.bg).not.toBe(trueCenter.bg);
  });
});
