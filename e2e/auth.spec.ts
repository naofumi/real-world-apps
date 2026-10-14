import { expect, test, type Page } from "@playwright/test";
import { submitLogin } from "./session.js";

declare global {
  interface Window {
    __conduit_debug__?: {
      getAuthState: () => string;
      getToken: () => string | null;
    };
  }
}

async function openWithToken(page: Page, token: string) {
  await page.addInitScript((value) => localStorage.setItem("jwtToken", value), token);
  await page.goto("/");
}

async function authProbe(page: Page) {
  return page.evaluate(() => {
    const debug = window.__conduit_debug__;
    return { state: debug?.getAuthState(), token: debug?.getToken() ?? null };
  });
}

test("a wrong password shows the credentials error", async ({ page }) => {
  await submitLogin(page, "demo@realworld.local", "wrongpassword");
  await expect(page.getByText("credentials invalid")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("a rejected token is cleared and the session becomes unauthenticated", async ({ page }) => {
  await openWithToken(page, "stale-token");
  await expect.poll(() => authProbe(page)).toEqual({ state: "unauthenticated", token: null });
});

test("a server error keeps the token and the session becomes unavailable", async ({ page }) => {
  await page.route("**/api/user", async (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET" || url.pathname !== "/api/user") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ errors: { server: ["internal error"] } }),
    });
  });
  await openWithToken(page, "kept-token");
  await expect.poll(() => authProbe(page)).toEqual({ state: "unavailable", token: "kept-token" });
});
