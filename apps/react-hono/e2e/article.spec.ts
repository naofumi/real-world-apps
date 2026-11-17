import { expect, test } from "@playwright/test";
import { login } from "./session.js";

test("the author sees Edit and someone else sees Follow", async ({ page }) => {
  await login(page, "demo@realworld.local", "password123");
  await page.goto("/article/a-feed-you-can-finish-reading");
  await expect(page.getByRole("link", { name: "Edit Article" }).first()).toBeVisible();

  await page.goto("/settings");
  await page.getByRole("button", { name: "Or click here to logout" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

  await login(page, "jane@realworld.local", "password123");
  await page.goto("/article/a-feed-you-can-finish-reading");
  await expect(page.getByRole("button", { name: "Follow demo" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit Article" })).toHaveCount(0);
});
