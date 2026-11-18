import { expect, test } from "@playwright/test";
import { login } from "./session";

test("post a comment", async ({ page }) => {
  await login(page, "cara@example.com", "password");
  await page.goto("/articles/global-feed");
  await page.locator('textarea[name="body"]').fill("A thoughtful note.");
  await page.getByRole("button", { name: "Post Comment" }).click();
  await expect(page.getByText("A thoughtful note.")).toBeVisible();
});
