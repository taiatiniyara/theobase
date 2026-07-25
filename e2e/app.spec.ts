import { test, expect, type Page } from "@playwright/test";
import { setupUser } from "./helpers";

async function login(page: Page, tokens: { accessToken: string; refreshToken: string }) {
  await page.evaluate((t) => localStorage.setItem("accessToken", t), tokens.accessToken);
  await page.evaluate((t) => localStorage.setItem("refreshToken", t), tokens.refreshToken);
}

test("finance dual-custody: batch page loads", async ({ page }) => {
  const email = `fin-e2e-${Date.now()}@test.com`;
  const tokens = await setupUser(email, "password123", "Finance Test", "E2E Conf");
  await login(page, tokens);
  await page.goto("/app/finance");
  await expect(page.locator("text=Finance").first()).toBeVisible({ timeout: 10000 });
});

test("attendance: page loads with form", async ({ page }) => {
  const email = `att-e2e-${Date.now()}@test.com`;
  const tokens = await setupUser(email, "password123", "Attendance Test");
  await login(page, tokens);
  await page.goto("/app/attendance");
  await expect(page.locator("text=Attendance").first()).toBeVisible({ timeout: 10000 });
});

test("contributions: page loads", async ({ page }) => {
  const email = `cont-e2e-${Date.now()}@test.com`;
  const tokens = await setupUser(email, "password123", "Contribs Test");
  await login(page, tokens);
  await page.goto("/app/contributions");
  await expect(page.locator("text=Contributions").first()).toBeVisible({ timeout: 10000 });
});

test("conference dashboard: renders summary", async ({ page }) => {
  const email = `conf-e2e-${Date.now()}@test.com`;
  const tokens = await setupUser(email, "password123", "Conf Dash Test", "E2E Conf");
  await login(page, tokens);
  await page.goto("/app/conference");
  await expect(page.locator("text=Conference").first()).toBeVisible({ timeout: 10000 });
});

test("members: page loads with list", async ({ page }) => {
  const email = `mem-e2e-${Date.now()}@test.com`;
  const tokens = await setupUser(email, "password123", "Members Test");
  await login(page, tokens);
  await page.goto("/app/members");
  await expect(page.locator("text=Members").first()).toBeVisible({ timeout: 10000 });
});

test("reports: quarterly report page loads", async ({ page }) => {
  const email = `rep-e2e-${Date.now()}@test.com`;
  const tokens = await setupUser(email, "password123", "Reports Test");
  await login(page, tokens);
  await page.goto("/app/reports");
  await expect(page.locator("text=Reports").first()).toBeVisible({ timeout: 10000 });
});

test("district dashboard: renders", async ({ page }) => {
  const email = `dist-e2e-${Date.now()}@test.com`;
  const tokens = await setupUser(email, "password123", "District Test");
  await login(page, tokens);
  await page.goto("/app/district");
  await expect(page.locator("text=District").first()).toBeVisible({ timeout: 10000 });
});

test("global dashboard: renders", async ({ page }) => {
  const email = `glb-e2e-${Date.now()}@test.com`;
  const tokens = await setupUser(email, "password123", "Global Test");
  await login(page, tokens);
  await page.goto("/app/global");
  await expect(page.locator("text=Global").first()).toBeVisible({ timeout: 10000 });
});
