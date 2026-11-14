import { expect, test } from "@playwright/test";
import { login } from "./session.js";

test("creating an article publishes and opens the article page", async ({ page }) => {
  await login(page, "anika@realworld.local", "password123");
  await page.goto("/editor");

  const title = `E2E create ${Date.now()}`;
  await page.locator("input[name=title]").fill(title);
  await page.locator("input[name=description]").fill("Created from Playwright");
  await page.locator("textarea[name=body]").fill("Body from the create editor path.");
  await page.getByRole("button", { name: "Publish Article" }).click();

  await expect(page).toHaveURL(/\/article\//);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
});

test("editing your own article saves and shows the updated fields", async ({ page }) => {
  await login(page, "demo@realworld.local", "password123");
  await page.goto("/editor/a-feed-you-can-finish-reading");

  const body = `Updated body ${Date.now()}`;
  await page.locator("textarea[name=body]").fill(body);
  await page.getByRole("button", { name: "Publish Article" }).click();

  await expect(page).toHaveURL(/\/article\/a-feed-you-can-finish-reading/);
  await expect(page.getByText(body)).toBeVisible();
});

test("editing someone else's article is refused", async ({ page }) => {
  await login(page, "jane@realworld.local", "password123");
  await page.goto("/editor/a-feed-you-can-finish-reading");

  await expect(page.getByText("You can only edit your own articles.")).toBeVisible();
  await expect(page.locator("input[name=title]")).toHaveCount(0);
});
