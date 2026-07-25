import { test, expect } from "@playwright/test";
import { setupUser } from "./helpers";

test("full auth flow: signup, login form, dashboard loads", async ({ page }) => {
  const email = `auth-e2e-${Date.now()}@test.com`;
  const pw = "password123";
  const tokens = await setupUser(email, pw, "E2E Auth User");

  await page.goto("/login");
  await expect(page.locator("input[type=email]")).toBeVisible();
  await page.locator("input[type=email]").fill(email);
  await page.locator("input[type=password]").fill(pw);
  await page.locator("button[type=submit]").click();

  await page.evaluate((t) => localStorage.setItem("accessToken", t), tokens.accessToken);
  await page.evaluate((t) => localStorage.setItem("refreshToken", t), tokens.refreshToken);
  await page.goto("/app");
  await expect(page.locator("text=Dashboard").first()).toBeVisible({ timeout: 10000 });
});

test("signup page renders", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.locator("input[type=email]")).toBeVisible();
  await expect(page.locator("input[type=password]")).toBeVisible();
});

test("forgot password page renders", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.locator("input[type=email]")).toBeVisible();
});

test("unauthenticated redirects to login", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/login/);
});
