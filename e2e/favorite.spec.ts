import { expect, test } from "@playwright/test";
import { login } from "./session.js";

test("a guest who favorites is sent to login", async ({ page }) => {
  await page.goto("/article/a-feed-you-can-finish-reading");
  await page.getByRole("button", { name: /Favorite Article/ }).first().click();

  await expect(page).toHaveURL(/\/login$/);
});

test("favoriting an article raises the count and unfavoriting restores it", async ({ page }) => {
  await login(page, "jane@realworld.local", "password123");
  await page.goto("/article/a-feed-you-can-finish-reading");
  const favorite = page.getByRole("button", { name: /Favorite Article/ }).first();
  await expect(favorite).toContainText("(0)");

  let favorited = false;
  try {
    await favorite.click();
    favorited = true;
    await expect(page.getByRole("button", { name: /Unfavorite Article/ }).first()).toContainText("(1)");
    await page.reload();
    await expect(page.getByRole("button", { name: /Unfavorite Article/ }).first()).toContainText("(1)");

    await page.getByRole("button", { name: /Unfavorite Article/ }).first().click();
    favorited = false;
    await expect(page.getByRole("button", { name: /Favorite Article/ }).first()).toContainText("(0)");
    await page.reload();
    await expect(page.getByRole("button", { name: /Favorite Article/ }).first()).toContainText("(0)");
  } finally {
    if (!favorited) return;
    await page.getByRole("button", { name: /Unfavorite Article/ }).first().click();
    await expect(page.getByRole("button", { name: /Favorite Article/ }).first()).toContainText("(0)");
  }
});

test("favoriting from the feed updates the preview count without a reload", async ({ page }) => {
  await login(page, "jane@realworld.local", "password123");
  await page.goto("/");

  const preview = page.locator(".article-preview").filter({ hasText: "A feed you can finish reading" });
  const favorite = preview.getByRole("button");
  await expect(favorite).toContainText("0");

  let favorited = false;
  try {
    await favorite.click();
    favorited = true;
    await expect(favorite).toContainText("1");

    await favorite.click();
    favorited = false;
    await expect(favorite).toContainText("0");
  } finally {
    if (!favorited) return;
    await favorite.click();
    await expect(favorite).toContainText("0");
  }
});
