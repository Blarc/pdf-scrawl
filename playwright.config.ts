import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false, // tests share a WS server
  reporter: [['list']],
  use: {
    // Point baseURL to the Vite dev server for faster feedback
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'bun run dev:frontend',
      port: 5173,
      reuseExistingServer: true,
      timeout: 20_000,
    },
    {
      command: 'bun run dev:server',
      port: 1234,
      reuseExistingServer: true,
      timeout: 20_000,
    },
  ],
});
