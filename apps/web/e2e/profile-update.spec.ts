import { test, expect } from "@playwright/test";

test.describe("Profile page redirection", () => {
  test("redirects unauthenticated user to sign-in from settings profile", async ({ page }) => {
    await page.goto("/settings/profile");
    await expect(page).toHaveURL(/.*sign-in/);
  });
});
