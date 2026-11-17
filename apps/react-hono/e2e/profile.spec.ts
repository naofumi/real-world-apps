import { expect, test } from "@playwright/test";

test("authored and favorited tabs show different article lists", async ({ page }) => {
  await page.goto("/profile/demo");

  await expect(page.getByRole("heading", { name: "A feed you can finish reading" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "SQLite is a serious application database" })).toHaveCount(0);

  await page.goto("/profile/demo/favorites");

  await expect(page.getByRole("heading", { name: "SQLite is a serious application database" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "A feed you can finish reading" })).toHaveCount(0);
});
