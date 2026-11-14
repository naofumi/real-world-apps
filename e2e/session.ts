import { expect, type Page } from "@playwright/test";

export async function login(
  page: Page,
  email = "alice@example.com",
  password = "password",
): Promise<void> {
  await page.goto("/login.php");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}
