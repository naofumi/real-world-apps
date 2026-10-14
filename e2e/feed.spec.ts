import { expect, test } from "@playwright/test";
import { login } from "./session.js";

test("your feed is empty when you follow nobody", async ({ page }) => {
  await login(page, "anika@realworld.local", "password123");
  await page.goto("/?feed=following");
  await expect(page.getByText("No articles are here... yet.")).toBeVisible();
});
