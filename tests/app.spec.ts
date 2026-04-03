import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { loginUser } from './setup';

const PDF_PATH = path.resolve(__dirname, 'fixtures/sample.pdf');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function uploadPDF(page: Page) {
  const input = page.locator('input[type="file"]');
  await input.setInputFiles(PDF_PATH);
  // Wait for the PDF canvas to appear — pdfjs renders a <canvas> per page
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15_000 });
}

async function clickTool(page: Page, label: string) {
  await page.getByRole('button', { name: label }).click();
}

// ---------------------------------------------------------------------------
// 1. Page loads
// ---------------------------------------------------------------------------

test.beforeEach(async ({ page }) => {
  page.on('console', msg => console.log(`[Browser] ${msg.type()}: ${msg.text()}`));
  await loginUser(page);
});

test('renders the app shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('PDF Annotate')).toBeVisible();
  // "Upload PDF" is a <label> wrapping a hidden <input>, not a <button>
  await expect(page.getByText('Upload PDF')).toBeVisible();
  // All drawing tools are present
  for (const label of ['Select', 'Rectangle', 'Pen', 'Eraser']) {
    await expect(page.getByRole('button', { name: label })).toBeVisible();
  }
});

test('shows empty-state prompt before upload', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Upload a PDF to get started')).toBeVisible();
  await expect(page.getByText('No annotations yet')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 2. PDF upload
// ---------------------------------------------------------------------------

test('renders PDF pages after upload', async ({ page }) => {
  await page.goto('/');
  await uploadPDF(page);
  // At least one canvas (= one rendered page) must be visible
  await expect(page.locator('canvas').first()).toBeVisible();
  // SVG annotation overlay is present
  await expect(page.locator('svg').first()).toBeVisible();
});

test('rejects a non-PDF file', async ({ page }) => {
  await page.goto('/');
  // Create a fake text file with non-PDF content
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({
    name: 'fake.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('not a pdf file'),
  });
  // Should show an alert dialog
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('valid PDF');
    await dialog.dismiss();
  });
  // Canvas should NOT appear — upload was rejected
  await expect(page.locator('canvas')).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// 3. Tool selection
// ---------------------------------------------------------------------------

test('active tool button is highlighted', async ({ page }) => {
  await page.goto('/');
  // Select is active by default
  const selectBtn = page.getByRole('button', { name: 'Select' });
  await expect(selectBtn).toHaveCSS('background-color', 'rgb(0, 102, 204)');

  // Click Rectangle — it becomes active
  await clickTool(page, 'Rectangle');
  const rectBtn = page.getByRole('button', { name: 'Rectangle' });
  await expect(rectBtn).toHaveCSS('background-color', 'rgb(0, 102, 204)');
  // Select is no longer active
  await expect(selectBtn).not.toHaveCSS('background-color', 'rgb(0, 102, 204)');
});

// ---------------------------------------------------------------------------
// 4. Drawing a rectangle annotation
// ---------------------------------------------------------------------------

test('draws a rectangle annotation and shows it in the sidebar', async ({ page }) => {
  await page.goto('/');
  await uploadPDF(page);

  await clickTool(page, 'Rectangle');

  const svg = page.locator('svg').first();
  const svgBox = await svg.boundingBox();
  expect(svgBox).not.toBeNull();

  const beforeRects = await svg.locator('rect').count();

  // Drag to draw a rectangle (30–70% of the page width/height)
  const startX = svgBox!.x + svgBox!.width * 0.3;
  const startY = svgBox!.y + svgBox!.height * 0.3;
  const endX = svgBox!.x + svgBox!.width * 0.7;
  const endY = svgBox!.y + svgBox!.height * 0.5;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 10 });
  await page.mouse.up();

  // A new <rect> element should appear in the SVG
  await expect(svg.locator('rect')).toHaveCount(beforeRects + 1, { timeout: 5_000 });

  // Annotation appears in the sidebar
  await expect(page.getByText(/p\.1 · rect/).first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// 5. Drawing a freehand annotation
// ---------------------------------------------------------------------------

test('draws a freehand annotation and shows it in the sidebar', async ({ page }) => {
  await page.goto('/');
  await uploadPDF(page);

  await clickTool(page, 'Pen');

  const svg = page.locator('svg').first();
  const svgBox = await svg.boundingBox();
  expect(svgBox).not.toBeNull();

  const beforePaths = await svg.locator('path[stroke]').count();

  // Draw a short line
  const x = svgBox!.x + svgBox!.width * 0.2;
  const y = svgBox!.y + svgBox!.height * 0.2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 80, y + 40, { steps: 15 });
  await page.mouse.move(x + 160, y + 20, { steps: 15 });
  await page.mouse.up();

  // A new <path> element should appear
  await expect(svg.locator('path[stroke]')).toHaveCount(beforePaths + 1, { timeout: 5_000 });

  // Sidebar shows the freehand annotation
  await expect(page.getByText('freehand').first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// 6. After drawing, tool switches back to Select
// ---------------------------------------------------------------------------

test('tool reverts to Select after drawing a rectangle', async ({ page }) => {
  await page.goto('/');
  await uploadPDF(page);
  await clickTool(page, 'Rectangle');

  const svg = page.locator('svg').first();
  const before = await svg.locator('rect').count();
  const box = await svg.boundingBox();
  const x = box!.x + box!.width * 0.2;
  const y = box!.y + box!.height * 0.2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 100, y + 60, { steps: 10 });
  await page.mouse.up();

  await expect(svg.locator('rect')).toHaveCount(before + 1, { timeout: 5_000 });

  // Select button should now be active
  const selectBtn = page.getByRole('button', { name: 'Select' });
  await expect(selectBtn).toHaveCSS('background-color', 'rgb(0, 102, 204)');
});

// ---------------------------------------------------------------------------
// 7. Comments
// ---------------------------------------------------------------------------

test('can add a comment to an annotation', async ({ page }) => {
  await page.goto('/');
  await uploadPDF(page);
  await clickTool(page, 'Rectangle');

  // Draw annotation
  const svg = page.locator('svg').first();
  const before = await svg.locator('rect').count();
  const box = await svg.boundingBox();
  await page.mouse.move(box!.x + 80, box!.y + 80);
  await page.mouse.down();
  await page.mouse.move(box!.x + 280, box!.y + 180, { steps: 10 });
  await page.mouse.up();

  await expect(svg.locator('rect')).toHaveCount(before + 1, { timeout: 5_000 });

  // Type a comment
  const input = page.locator('input[placeholder="Add comment…"]').first();
  await input.fill('Hello from test');
  await input.press('Enter');

  await expect(page.getByText('Hello from test').first()).toBeVisible();
});

test('disables Send when comment exceeds 2000 chars', async ({ page }) => {
  await page.goto('/');
  await uploadPDF(page);
  await clickTool(page, 'Rectangle');

  const svg = page.locator('svg').first();
  const before = await svg.locator('rect').count();
  const box = await svg.boundingBox();
  await page.mouse.move(box!.x + 80, box!.y + 80);
  await page.mouse.down();
  await page.mouse.move(box!.x + 280, box!.y + 180, { steps: 10 });
  await page.mouse.up();

  await expect(svg.locator('rect')).toHaveCount(before + 1, { timeout: 5_000 });

  const input = page.locator('input[placeholder="Add comment…"]').first();
  // Fill with 2001 characters
  await input.fill('a'.repeat(2001));

  const sendBtn = page.locator('button', { hasText: 'Send' }).first();
  await expect(sendBtn).toBeDisabled();
});

// ---------------------------------------------------------------------------
// 8. Resolve / Reopen
// ---------------------------------------------------------------------------

test('resolves and reopens an annotation', async ({ page }) => {
  await page.goto('/');
  await uploadPDF(page);
  await clickTool(page, 'Rectangle');

  const svg = page.locator('svg').first();
  const before = await svg.locator('rect').count();
  const box = await svg.boundingBox();
  await page.mouse.move(box!.x + 80, box!.y + 80);
  await page.mouse.down();
  await page.mouse.move(box!.x + 280, box!.y + 180, { steps: 10 });
  await page.mouse.up();

  await expect(svg.locator('rect')).toHaveCount(before + 1, { timeout: 5_000 });

  // Resolve the annotation
  const resolveBtn = page.getByRole('button', { name: 'Resolve' }).first();
  await resolveBtn.click();

  // Button now reads "Reopen"
  await expect(page.getByRole('button', { name: 'Reopen' }).first()).toBeVisible();
  // Sidebar shows "Resolved" label
  await expect(page.getByText('Resolved').first()).toBeVisible();

  // Reopen it
  await page.getByRole('button', { name: 'Reopen' }).first().click();
  await expect(page.getByRole('button', { name: 'Resolve' }).first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// 9. Delete annotation
// ---------------------------------------------------------------------------

test('deletes an annotation via the × button', async ({ page }) => {
  await page.goto('/');
  await uploadPDF(page);
  await clickTool(page, 'Rectangle');

  const svg = page.locator('svg').first();
  const before = await svg.locator('rect').count();
  const box = await svg.boundingBox();
  await page.mouse.move(box!.x + 80, box!.y + 80);
  await page.mouse.down();
  await page.mouse.move(box!.x + 280, box!.y + 180, { steps: 10 });
  await page.mouse.up();

  await expect(svg.locator('rect')).toHaveCount(before + 1, { timeout: 5_000 });

  // Click the × delete button for the most recently added annotation
  await page.locator('button[title="Delete annotation"]').last().click();

  // Rect count should be back to what it was before we drew
  await expect(svg.locator('rect')).toHaveCount(before, { timeout: 5_000 });
});

// ---------------------------------------------------------------------------
// 10. User presence indicator
// ---------------------------------------------------------------------------

test('shows a connection status indicator', async ({ page }) => {
  await page.goto('/');
  await uploadPDF(page);
  // The coloured dot (●) in the header — either green (connected) or red
  // We look for the span with border-radius 50% in the UserPresence component
  const dot = page.locator('div[style*="display: flex"] > span[style*="border-radius"]').first();
  await expect(dot).toBeVisible();
});

// ---------------------------------------------------------------------------
// 11. Room creation and shareable link
// ---------------------------------------------------------------------------

test('uploading a PDF creates a room and shows Share link button', async ({ page }) => {
  await page.goto('/');
  // No hash before upload
  expect(page.url()).not.toContain('#');

  await uploadPDF(page);

  // URL hash should have been set to the room ID
  await expect(page).toHaveURL(/#.+/);

  // "Share link" button should appear in the header
  await expect(page.getByRole('button', { name: 'Share link' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 12. Real-time sync between two tabs (via shareable room link)
// ---------------------------------------------------------------------------

test('annotation drawn in one tab appears in a second tab', async ({ browser, baseURL }) => {
  const ctx1 = await browser.newContext({ baseURL });
  const ctx2 = await browser.newContext({ baseURL });
  const page1 = await ctx1.newPage();
  const page2 = await ctx2.newPage();

  // Tab 1: Login and upload PDF → creates the room
  await loginUser(page1);
  await uploadPDF(page1);
  // Wait for the room URL to be set
  await expect(page1).toHaveURL(/#.+/);
  const roomUrl = page1.url();

  // Tab 2: login, then navigate to the same room URL → receives PDF via Yjs sync
  await loginUser(page2);
  await page2.goto(roomUrl);
  // Wait for the PDF to be synced and rendered in tab 2
  await expect(page2.locator('canvas').first()).toBeVisible({ timeout: 15_000 });

  // Wait for both pages to connect to the Yjs WS server.
  await expect(page1.locator('span[title="Connected"]')).toBeVisible({ timeout: 15_000 });
  await expect(page2.locator('span[title="Connected"]')).toBeVisible({ timeout: 15_000 });

  // Count existing rects before drawing so we can assert +1
  const svg1 = page1.locator('svg').first();
  const svg2 = page2.locator('svg').first();
  const beforeCount = await svg2.locator('rect').count();

  // Draw a rectangle in tab 1
  await clickTool(page1, 'Rectangle');
  const box = await svg1.boundingBox();
  await page1.mouse.move(box!.x + 80, box!.y + 80);
  await page1.mouse.down();
  await page1.mouse.move(box!.x + 260, box!.y + 160, { steps: 10 });
  await page1.mouse.up();

  // Should appear in tab 1
  await expect(svg1.locator('rect')).toHaveCount(beforeCount + 1, { timeout: 5_000 });

  // Should sync to tab 2 within a few seconds
  await expect(svg2.locator('rect')).toHaveCount(beforeCount + 1, { timeout: 8_000 });

  await ctx1.close();
  await ctx2.close();
});

test('comment added in one tab appears in a second tab', async ({ browser, baseURL }) => {
  const ctx1 = await browser.newContext({ baseURL });
  const ctx2 = await browser.newContext({ baseURL });
  const page1 = await ctx1.newPage();
  const page2 = await ctx2.newPage();

  // Tab 1: login and upload PDF → creates the room
  await loginUser(page1);
  await uploadPDF(page1);
  await expect(page1).toHaveURL(/#.+/);
  const roomUrl = page1.url();

  // Tab 2: join via the room URL after logging in
  await loginUser(page2);
  await page2.goto(roomUrl);
  await expect(page2.locator('canvas').first()).toBeVisible({ timeout: 15_000 });

  // Wait for both to connect to the Yjs WS server
  await expect(page1.locator('span[title="Connected"]')).toBeVisible({ timeout: 15_000 });
  await expect(page2.locator('span[title="Connected"]')).toBeVisible({ timeout: 15_000 });

  const svg1 = page1.locator('svg').first();
  const svg2 = page2.locator('svg').first();
  const beforeCount = await svg2.locator('rect').count();

  // Draw annotation in tab 1
  await clickTool(page1, 'Rectangle');
  const box = await svg1.boundingBox();
  await page1.mouse.move(box!.x + 80, box!.y + 80);
  await page1.mouse.down();
  await page1.mouse.move(box!.x + 260, box!.y + 160, { steps: 10 });
  await page1.mouse.up();
  await expect(svg1.locator('rect')).toHaveCount(beforeCount + 1, { timeout: 5_000 });

  // Wait for the annotation to appear in tab 2
  await expect(svg2.locator('rect')).toHaveCount(beforeCount + 1, { timeout: 8_000 });

  // Add a comment in tab 1
  const input1 = page1.locator('input[placeholder="Add comment…"]').first();
  await input1.fill('sync test comment');
  await input1.press('Enter');
  await expect(page1.getByText('sync test comment').first()).toBeVisible();

  // Comment should appear in tab 2
  await expect(page2.getByText('sync test comment').first()).toBeVisible({ timeout: 8_000 });

  await ctx1.close();
  await ctx2.close();
});
