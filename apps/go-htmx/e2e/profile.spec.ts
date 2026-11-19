import { expect, test } from "@playwright/test";
import { login } from "./session";

test("follow and unfollow from profile", async ({ page }) => {
  await login(page, "cara@example.com", "password");
  await page.goto("/users/alice");
  await page.getByRole("button", { name: /Follow alice/ }).click();
  await expect(page.getByRole("button", { name: /Unfollow alice/ })).toBeVisible();
  await page.getByRole("button", { name: /Unfollow alice/ }).click();
  await expect(page.getByRole("button", { name: /Follow alice/ })).toBeVisible();
});
