import { expect, test } from '@playwright/test';

const STORIES = [
  'form-button--variants',
  'form-button--sizes',
  'form-button--loading',
  'form-input--default',
  'form-input--states',
  'form-input--auth-fields',
  'form-textarea--default',
  'form-textarea--states',
  'form-select--default',
  'form-select--disabled',
  'form-checkbox--default',
  'form-checkbox--checked',
  'form-checkbox--disabled',
  'form-radiogroup--default',
  'form-radiogroup--disabled',
  'form-switch--default',
  'form-switch--checked',
  'form-switch--disabled',
  'form-slider--default',
  'form-slider--disabled',
  'form-segmentedpicker--default',
  'form-segmentedpicker--disabled',
  'form-submitbutton--default',
  'form-submitbutton--loading',
  'form-submitbutton--disabled',
  'overlay-popover--open-by-default',
  'overlay-dropdownmenu--open-by-default',
  'overlay-contextmenu--open-by-default',
  'overlay-sheet--open-by-default',
  'overlay-tooltip--open-by-default',
  'overlay-alertdialog--open-by-default',
  'overlay-commandpalette--open-by-default',
  'feedback-banner--default',
  'feedback-banner--compact',
  'feedback-skeleton--default',
  'feedback-progress--default',
  'feedback-chatbubble--conversation',
  'feedback-kbdchip--default',
  'feedback-pingdot--default',
  'feedback-pingdot--static',
  'feedback-toaster--default',
  'layout-accordion--default',
  'layout-tabs--default',
  'layout-avatar--default',
  'layout-avatar--group',
  'layout-scrollarea--default',
  'layout-separator--default',
  'layout-sectionheading--default',
  'layout-cardwell--default',
  'layout-iconbadge--default',
  'layout-highlight--default',
  'layout-bentogrid--default',
  'os-dock--default',
  'feedback-badge--tones',
  'feedback-badge--with-pulse',
  'identity-glasssurface--panel',
  'identity-personalization--playground',
  'feedback-spinner--sizes',
  'feedback-spinner--with-label',
  'os-window--active',
  'os-window--inactive'
];

test.describe('design system catalog visual regression', () => {
  for (const storyId of STORIES) {
    for (const theme of ['light', 'dark'] as const) {
      test(`${storyId} [${theme}]`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
        await page.goto(`http://localhost:61000/iframe.html?id=${storyId}&viewMode=story&globals=theme:${theme}`);

        const root = page.locator('#storybook-root');
        await expect(root).toBeVisible();

        // Allow any fonts to load
        await page.waitForLoadState('networkidle');

        await expect(root).toHaveScreenshot(`${storyId}-${theme}.png`, { animations: 'disabled' });
      });
    }
  }
});
