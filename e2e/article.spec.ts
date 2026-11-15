import { expect, test } from "@playwright/test";
import { login } from "./session";

test("article page shows body and author chrome", async ({ page }) => {
  await page.goto("/article.php?slug=a-vanilla-php-stack");
  await expect(page.getByRole("heading", { name: "A vanilla PHP stack" })).toBeVisible();
  await expect(page.getByRole("link", { name: "alice" }).first()).toBeVisible();
});

test("author can edit; other user sees follow instead", async ({ page }) => {
  await login(page, "alice@example.com", "password");
  await page.goto("/article.php?slug=a-vanilla-php-stack");
  await expect(page.getByRole("link", { name: "Edit Article" })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await login(page, "bob@example.com", "password");
  await page.goto("/article.php?slug=a-vanilla-php-stack");
  await expect(page.getByRole("link", { name: "Edit Article" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Unfollow alice|Follow alice/ })).toBeVisible();
});

test("create publishes a new article", async ({ page }) => {
  await login(page, "cara@example.com", "password");
  await page.goto("/article_new.php");
  await page.locator("#title").fill("E2E Published Piece");
  await page.locator("#description").fill("From Playwright");
  await page.locator("#body").fill("Hello from **e2e**.");
  await page.locator("#tag_list").fill("e2e, php");
  await page.getByRole("button", { name: "Publish Article" }).click();

  await expect(page).toHaveURL(/article\.php\?slug=e2e-published-piece/);
  await expect(page.getByRole("heading", { name: "E2E Published Piece" })).toBeVisible();
  await expect(page.getByText("Hello from")).toBeVisible();
});
