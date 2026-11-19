import { expect, test } from "@playwright/test";
import { login } from "./session";

test("publish a new article", async ({ page }) => {
  await login(page);
  await page.goto("/articles/new");
  await page.locator('input[name="title"]').fill("Hello from Playwright");
  await page.locator('input[name="description"]').fill("E2E create");
  await page.locator('textarea[name="body"]').fill("Body of the article.");
  await page.locator('input[name="tagList"]').fill("go e2e");
  await page.getByRole("button", { name: "Publish Article" }).click();
  await expect(page.getByRole("heading", { name: "Hello from Playwright" })).toBeVisible();
  await expect(page).toHaveURL(/\/articles\/hello-from-playwright/);
});
