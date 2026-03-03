import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the page title", async ({ page }) => {
    await expect(page).toHaveTitle(/OP\.GG Clone/i);
  });

  test("renders the summoner search form", async ({ page }) => {
    await expect(page.getByPlaceholder("Enter summoner name...")).toBeVisible();
    await expect(page.getByRole("combobox")).toBeVisible(); // region select
  });

  test("skip link is present for accessibility", async ({ page }) => {
    const skipLink = page.getByRole("link", { name: /skip to main content/i });
    await expect(skipLink).toBeAttached();
  });

  test("region select has expected options", async ({ page }) => {
    const select = page.getByRole("combobox");
    await expect(select.locator("option[value='na1']")).toBeAttached();
    await expect(select.locator("option[value='euw1']")).toBeAttached();
    await expect(select.locator("option[value='kr']")).toBeAttached();
  });
});
