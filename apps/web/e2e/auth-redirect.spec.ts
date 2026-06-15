import { test, expect } from '@playwright/test';

test('redirects unauthenticated user to sign-in from dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/.*sign-in/);
});
