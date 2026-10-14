import { expect, test } from "@playwright/test";
import { login } from "./session.js";

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
