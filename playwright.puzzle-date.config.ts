import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e_tests',
  testMatch: 'stats-puzzle-date.test.ts',
  metadata: { puzzleDateKey: 'puzzle-date-test-key' },
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: '/tmp/globle-solid-puzzle-results',
  use: { baseURL: 'http://127.0.0.1:4317' },
  webServer: {
    command:
      'env -i PATH="$PATH" HOME="$HOME" node_modules/.bin/vite --config vite.puzzle-date.config.ts --host 127.0.0.1 --port 4317',
    url: 'http://127.0.0.1:4317',
    reuseExistingServer: false,
  },
});
