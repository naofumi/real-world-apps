import { expect, test } from "@playwright/test";
import { login } from "./session";

test("global feed lists seeded articles", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".feed-toggle a.active")).toHaveText("Global Feed");
  await expect(page.getByRole("link", { name: "A vanilla PHP stack" })).toBeVisible();
});

test("tag filter narrows the list", async ({ page }) => {
  await page.goto("/?tag=dragons");
  const previews = page.locator(".article-preview");
  await expect(previews.getByRole("link", { name: "Global feed" })).toBeVisible();
  await expect(previews.getByRole("link", { name: "A vanilla PHP stack" })).toHaveCount(0);
});

test("your feed shows followed authors only", async ({ page }) => {
  // Seed: bob follows alice.
  await login(page, "bob@example.com", "password");
  await page.goto("/feed.php");
  await expect(page.locator(".feed-toggle a.active")).toHaveText("Your Feed");
  const previews = page.locator(".article-preview");
  await expect(previews.getByRole("link", { name: "A vanilla PHP stack" })).toBeVisible();
  await expect(previews.getByRole("link", { name: "Global feed" })).toHaveCount(0);
});

