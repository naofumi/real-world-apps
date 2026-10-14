import { expect, type Page } from "@playwright/test";

export async function submitLogin(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("input[name=email]").fill(email);
  await page.locator("input[name=password]").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function login(page: Page, email: string, password: string) {
  await submitLogin(page, email, password);
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
}
