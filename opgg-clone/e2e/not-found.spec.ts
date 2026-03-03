import { test, expect } from "@playwright/test";

test.describe("404 page", () => {
  test("shows not-found page for an unknown route", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.getByText("Page not found")).toBeVisible();
    await expect(page.getByRole("link", { name: /search for a summoner/i })).toBeVisible();
  });

  test("not-found page links back to home", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await page.getByRole("link", { name: /search for a summoner/i }).click();
    await expect(page).toHaveURL("/");
  });
});
