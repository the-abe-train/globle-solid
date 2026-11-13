import { defineConfig, devices } from '@playwright/test';
process.env.CRYPTO_KEY = 'puzzle-date-test-key';
process.env.VITE_CRYPTO_KEY = 'puzzle-date-test-key';
export default defineConfig({
  testDir: './tests/e2e_tests',
  testMatch: '*.test.ts',
  testIgnore: ['**/security/**', '**/support/**'],
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  reporter: 'list',
  metadata: { puzzleDateKey: 'puzzle-date-test-key' },
  use: {
    baseURL: 'http://127.0.0.1:4317',
    testIdAttribute: 'data-cy',
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'env -i PATH="$PATH" HOME="$HOME" node tests/support/server.mjs 4317',
    url: 'http://127.0.0.1:4317',
    reuseExistingServer: false,
  },
});
