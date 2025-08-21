import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Look for tests in both legacy e2eTests and new tests/e2e_tests folders
  testDir: '.',
  testMatch: [
    'e2eTests/**/*.test.ts',
    'tests/e2e_tests/**/*.test.ts',
  ],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8788',
    testIdAttribute: 'data-cy',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && vite preview --port 8788',
    url: 'http://localhost:8788',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
