import { expect, test } from '@playwright/test';

test('mobile game page shows read-only tablet or desktop guidance', async ({ page }) => {
  await page.goto('/problems/instagram');
  await expect(page.getByText(/Mobile preview/i)).toBeVisible();
  await expect(page.getByText(/tablet or desktop/i)).toBeVisible();
});
