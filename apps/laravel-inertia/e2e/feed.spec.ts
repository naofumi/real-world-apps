import { expect, test } from '@playwright/test';

test('global feed lists seeded articles and tag filter works', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'conduit' })).toBeVisible();
    await expect(page.getByText('A vanilla Laravel stack')).toBeVisible();

    await page.locator('.sidebar .tag-list a', { hasText: 'dragons' }).first().click();
    await expect(page).toHaveURL(/tag=dragons/);
    await expect(page.getByText('How to train your dragon')).toBeVisible();
});
