import { expect, test } from '@playwright/test';

test('authenticated user can publish an article', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('alice@example.com');
    await page.getByPlaceholder('Password').fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.getByRole('link', { name: /New Article/ }).click();
    await page.getByPlaceholder('Article Title').fill('Playwright Article');
    await page.getByPlaceholder("What's this article about?").fill('E2E coverage');
    await page.getByPlaceholder('Write your article (in markdown)').fill('Hello **world**');
    await page.getByPlaceholder('Enter tags').fill('e2e');
    await page.getByRole('button', { name: 'Publish Article' }).click();

    await expect(page.getByRole('heading', { name: 'Playwright Article' })).toBeVisible();
    await expect(page.getByText('world')).toBeVisible();
});
