import { expect, test } from "@playwright/test";
import { login } from "./session";

test("signed-in user can post a comment", async ({ page }) => {
  await login(page, "cara@example.com", "password");
  await page.goto("/article.php?slug=following-people");
  await page.locator("#body").fill("E2E comment body");
  await page.getByRole("button", { name: "Post Comment" }).click();
  await expect(page.getByText("E2E comment body")).toBeVisible();
});
