import { expect, test } from "@playwright/test";
import { login } from "./session.js";

test("your feed is empty when you follow nobody", async ({ page }) => {
  await login(page, "anika@realworld.local", "password123");
  await page.goto("/?feed=following");
  await expect(page.getByText("No articles are here... yet.")).toBeVisible();
});

test("your feed shows articles from people you follow", async ({ page }) => {
  await login(page, "demo@realworld.local", "password123");
  await page.goto("/?feed=following");

  await expect(page.getByRole("heading", { name: "SQLite is a serious application database" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What a modular monolith is for" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "A feed you can finish reading" })).toHaveCount(0);
});

test("a tag page only lists articles with that tag", async ({ page }) => {
  await page.goto("/tag/react");

  await expect(page.getByRole("heading", { name: "A feed you can finish reading" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "SQLite is a serious application database" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "What a modular monolith is for" })).toHaveCount(0);
});
