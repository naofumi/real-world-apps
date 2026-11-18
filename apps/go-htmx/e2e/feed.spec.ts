import { expect, test } from "@playwright/test";
import { login } from "./session";

test("global feed lists seeded articles", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".feed-toggle").getByRole("link", { name: "Global Feed", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "A Go HTMX stack" })).toBeVisible();
});

test("tag filter narrows the list", async ({ page }) => {
  await page.goto("/?tag=dragons");
  const previews = page.locator(".article-preview");
  await expect(previews.getByRole("link", { name: "Global feed" })).toBeVisible();
  await expect(previews.getByRole("link", { name: "A Go HTMX stack" })).toHaveCount(0);
});

test("your feed shows followed authors only", async ({ page }) => {
  await login(page, "bob@example.com", "password");
  await page.goto("/feed");
  await expect(page.locator(".feed-toggle a.nav-link.active")).toHaveText("Your Feed");
  const previews = page.locator(".article-preview");
  await expect(previews.getByRole("link", { name: "A Go HTMX stack" })).toBeVisible();
  await expect(previews.getByRole("link", { name: "Global feed" })).toHaveCount(0);
});
