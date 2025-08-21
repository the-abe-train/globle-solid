// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Test configuration
    environment: "happy-dom", // Use happy-dom for DOM testing
    globals: true, // Enable global test functions
    watch: true,
    testTimeout: 10_000, // Set test timeout to 10 seconds
    include: [
      "tests/unit_tests/**/*.{test,spec}.{ts,tsx,js,jsx}",
    ],
    exclude: [
      "node_modules/**",
      "dist/**",
      "e2eTests/**",
      "tests/e2e_tests/**",
    ],
  },
  define: {
    // This helps resolve the "ws does not work in browser" error
    global: "globalThis",
  },
  // Explicitly set browser: false for problematic dependencies
  optimizeDeps: {
    exclude: ["ws", "puppeteer"],
  },
});
