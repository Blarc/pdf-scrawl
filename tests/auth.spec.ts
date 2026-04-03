import { test, expect } from '@playwright/test';

test('Registration and login flow', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Should see login page
  await expect(page.getByText('Sign in to PDF Scrawl')).toBeVisible();

  // Switch to registration
  await page.getByText('Register here').click();
  await expect(page.getByText('Create an account')).toBeVisible();

  // Register
  await page.locator('input[type="text"]').first().fill('testuser');
  await page.locator('input[type="password"]').fill('testpassword');
  await page.getByRole('button', { name: 'Register' }).click();

  // Should be logged in and see Landing View
  await expect(page.getByText('Upload a PDF to get started')).toBeVisible();
  await expect(page.getByText('Hi, testuser')).toBeVisible();

  // Logout
  await page.getByRole('button', { name: 'Logout' }).click();

  // Should see login page again
  await expect(page.getByText('Sign in to PDF Scrawl')).toBeVisible();
});

test('Login with existing user', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Register first to make sure user exists
  await page.getByText('Register here').click();
  await page.locator('input[type="text"]').first().fill('loginuser');
  await page.locator('input[type="password"]').fill('loginpassword');
  await page.getByRole('button', { name: 'Register' }).click();
  
  await expect(page.getByText('Hi, loginuser')).toBeVisible();
  await page.getByRole('button', { name: 'Logout' }).click();

  // Login
  await page.locator('input[type="text"]').fill('loginuser');
  await page.locator('input[type="password"]').fill('loginpassword');
  await page.getByRole('button', { name: 'Login' }).click();

  // Should be logged in
  await expect(page.getByText('Hi, loginuser')).toBeVisible();
});
