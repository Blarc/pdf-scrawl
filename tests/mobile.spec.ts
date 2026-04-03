import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { loginUser } from './setup';

const PDF_PATH = path.resolve(__dirname, 'fixtures/sample.pdf');

// Configure test to use a mobile viewport
test.use({
  viewport: { width: 375, height: 667 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/004.1',
  isMobile: true,
  hasTouch: true,
});

async function uploadPDF(page: Page) {
  const input = page.locator('input[type="file"]');
  await input.setInputFiles(PDF_PATH);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15_000 });
}

test.beforeEach(async ({ page }) => {
  page.on('console', msg => console.log(`[Browser] ${msg.type()}: ${msg.text()}`));
  await loginUser(page);
});

test('mobile: renders the app shell and toolbar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('PDF Annotate')).toBeVisible();
  await expect(page.getByText('Upload PDF')).toBeVisible();
  // Drawing tools should be visible and scrollable in the toolbar
  for (const label of ['Select', 'Rectangle', 'Pen', 'Eraser']) {
    await expect(page.getByRole('button', { name: label })).toBeVisible();
  }
});

test('mobile: shows empty-state prompt and no sidebar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Upload a PDF to get started')).toBeVisible();
  // "No annotations yet" is in the sidebar, which should be hidden on mobile
  await expect(page.getByText('No annotations yet')).not.toBeVisible();
});

test('mobile: switches between PDF and Comments view', async ({ page }) => {
  await page.goto('/');
  await uploadPDF(page);

  // Initially in PDF view
  await expect(page.locator('canvas').first()).toBeVisible();
  await expect(page.getByText('Annotations (0)')).not.toBeVisible();

  // Switch to Comments view
  const commentsToggle = page.getByRole('button', { name: /Comments/ });
  await commentsToggle.click();

  // Now in Comments view
  await expect(page.locator('canvas').first()).not.toBeVisible();
  await expect(page.getByText('Annotations (0)')).toBeVisible();

  // Switch back to PDF view
  const pdfToggle = page.getByRole('button', { name: 'PDF' });
  await pdfToggle.click();

  // Now back in PDF view
  await expect(page.locator('canvas').first()).toBeVisible();
  await expect(page.getByText('Annotations (0)')).not.toBeVisible();
});

test('mobile: selecting an annotation switches to Comments view', async ({ page }) => {
  await page.goto('/');
  await uploadPDF(page);

  // Draw a rectangle
  await page.getByRole('button', { name: 'Rectangle' }).click();
  const svg = page.locator('svg').first();
  const box = await svg.boundingBox();
  expect(box).not.toBeNull();

  // Use touch events to draw
  const startX = box!.x + box!.width * 0.3;
  const startY = box!.y + box!.height * 0.3;
  const endX = box!.x + box!.width * 0.7;
  const endY = box!.y + box!.height * 0.5;

  await page.touchscreen.tap(startX, startY); // Start
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 10 });
  await page.mouse.up();

  // Drawing an annotation should keep us in PDF view, but tool switches back to select
  await expect(page.locator('canvas').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Select' })).toHaveCSS('background-color', 'rgb(0, 102, 204)');

  // Now click/tap the annotation to select it
  const rect = svg.locator('rect').first();
  await rect.tap();

  // Selecting should automatically switch to Comments view
  await expect(page.locator('canvas').first()).not.toBeVisible();
  await expect(page.getByText('Annotations (1)')).toBeVisible();
  await expect(page.getByText('p.1 · rect')).toBeVisible();
});

test('mobile: clicking on a comment switches back to PDF view', async ({ page }) => {
  await page.goto('/');
  await uploadPDF(page);

  // Add an annotation
  await page.getByRole('button', { name: 'Rectangle' }).click();
  const svg = page.locator('svg').first();
  const box = await svg.boundingBox();
  await page.mouse.move(box!.x + 100, box!.y + 100);
  await page.mouse.down();
  await page.mouse.move(box!.x + 200, box!.y + 200, { steps: 5 });
  await page.mouse.up();

  // Switch to Comments view
  await page.getByRole('button', { name: /Comments/ }).click();
  await expect(page.getByText('Annotations (1)')).toBeVisible();

  // Click on the annotation in the list
  await page.getByText('p.1 · rect').click();

  // Should switch back to PDF view
  await expect(page.locator('canvas').first()).toBeVisible();
  await expect(page.getByText('Annotations (1)')).not.toBeVisible();
});

test('mobile: clicking comment input does not close the panel', async ({ page }) => {
  await page.goto('/');
  await uploadPDF(page);

  // Add an annotation
  await page.getByRole('button', { name: 'Rectangle' }).click();
  const svg = page.locator('svg').first();
  const box = await svg.boundingBox();
  await page.mouse.move(box!.x + 100, box!.y + 100);
  await page.mouse.down();
  await page.mouse.move(box!.x + 200, box!.y + 200);
  await page.mouse.up();

  // Switch to Comments view
  await page.getByRole('button', { name: /Comments/ }).click();
  await expect(page.getByText('Annotations (1)')).toBeVisible();

  // Click on the input field
  const input = page.locator('input[placeholder="Add comment…"]').first();
  await input.click();

  // Panel should still be visible
  await expect(page.getByText('Annotations (1)')).toBeVisible();
  await expect(page.locator('canvas').first()).not.toBeVisible();
});
