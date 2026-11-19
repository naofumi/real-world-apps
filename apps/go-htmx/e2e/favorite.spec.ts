import { expect, test } from "@playwright/test";
import { login } from "./session";

test("favorite and unfavorite an article", async ({ page }) => {
  await login(page, "cara@example.com", "password");
  await page.goto("/articles/a-go-htmx-stack");
  await page.getByRole("button", { name: /Favorite / }).click();
  await expect(page.getByRole("button", { name: /Unfavorite / })).toBeVisible();
  await page.getByRole("button", { name: /Unfavorite / }).click();
  await expect(page.getByRole("button", { name: /Favorite / })).toBeVisible();
});
