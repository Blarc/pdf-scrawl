import { type Page, expect } from '@playwright/test';

export async function loginUser(page: Page, username = `user_${Math.random().toString(36).substring(2, 7)}`, password = 'testpassword', displayName = 'Test User') {
  await page.goto('/');
  
  // If we're already logged in, skip
  if (await page.getByText('Upload a PDF to get started').isVisible()) {
    return;
  }

  // Go to registration page
  await page.getByText('Register here').click();
  await expect(page.getByText('Create an account')).toBeVisible();

  // Register
  await page.locator('input[type="text"]').first().fill(username);
  await page.locator('input[type="password"]').fill(password);
  await page.getByPlaceholder('What others will see').fill(displayName);
  await page.getByRole('button', { name: 'Register' }).click();

  // Wait for login to complete
  await expect(page.getByText(/Hi,/).first()).toBeVisible({ timeout: 10_000 });
}
