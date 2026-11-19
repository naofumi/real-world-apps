import { expect, test } from '@playwright/test';

test('sign in and see home feed', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('alice@example.com');
    await page.getByPlaceholder('Password').fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('navigation').getByText('alice')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'conduit' })).toBeVisible();
});

test('wrong password stays on login with errors', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('alice@example.com');
    await page.getByPlaceholder('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.error-messages')).toBeVisible();
});
