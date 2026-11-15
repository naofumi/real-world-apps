import { expect, test } from "@playwright/test";
import { login } from "./session";

test("profile tabs switch authored vs favorited lists", async ({ page }) => {
  await page.goto("/profile.php?username=alice");
  await expect(page.getByRole("heading", { name: "alice" })).toBeVisible();
  await expect(page.getByRole("link", { name: "A vanilla PHP stack" })).toBeVisible();

  await page.goto("/profile_favorites.php?username=bob");
  // Seed: bob favorited a-vanilla-php-stack.
  await expect(page.getByRole("link", { name: "A vanilla PHP stack" })).toBeVisible();
});

test("follow then unfollow from a profile", async ({ page }) => {
  await login(page, "cara@example.com", "password");
  await page.goto("/profile.php?username=bob");
  await page.getByRole("button", { name: "Follow bob" }).click();
  await expect(page.getByRole("button", { name: "Unfollow bob" })).toBeVisible();
  await page.getByRole("button", { name: "Unfollow bob" }).click();
  await expect(page.getByRole("button", { name: "Follow bob" })).toBeVisible();
});
