import { expect, test } from "@playwright/test";
import { login } from "./session";

test("wrong password shows an error and stays on login", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#email").fill("alice@example.com");
  await page.locator("#password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("email or password is invalid")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("sign in and sign out round-trip", async ({ page }) => {
  await login(page, "alice@example.com", "password");
  await expect(page.getByRole("navigation").getByRole("link", { name: "alice" })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("navigation").getByRole("link", { name: "Sign in" })).toBeVisible();
});
