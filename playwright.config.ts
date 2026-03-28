import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false, // tests share a WS server
  reporter: [['list']],
  use: {
    // Point baseURL to the backend server which now also serves the frontend
    baseURL: 'http://localhost:1234',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Start the backend server before running tests.
  // The backend server now serves both the API and the frontend static files.
  webServer: [
    {
      command: 'npm run dev:server', // Uses tsx server.ts for development, will build with tsc in production
      port: 1234,
      reuseExistingServer: true, // Allow Playwright to reuse if already running, but we'll manage its lifecycle
      timeout: 20_000,
    },
  ],
});
