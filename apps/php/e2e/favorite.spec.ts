import { expect, test } from "@playwright/test";
import { login } from "./session";

test("favoriting raises the count and unfavoriting restores it", async ({ page }) => {
  await login(page, "cara@example.com", "password");
  await page.goto("/article.php?slug=global-feed");

  // Banner + article-actions both render the favorite control (Conduit layout).
  const favorite = page.locator(".banner").getByRole("button", { name: /Favorite/ });
  await expect(favorite).toContainText("(0)");
  await favorite.click();

  const unfavorite = page.locator(".banner").getByRole("button", { name: /Unfavorite/ });
  await expect(unfavorite).toContainText("(1)");
  await page.reload();
  await expect(page.locator(".banner").getByRole("button", { name: /Unfavorite/ })).toContainText("(1)");

  await page.locator(".banner").getByRole("button", { name: /Unfavorite/ }).click();
  await expect(page.locator(".banner").getByRole("button", { name: /Favorite/ })).toContainText("(0)");
});
