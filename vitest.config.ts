// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Test configuration
    environment: "node", // Ensure we're running in Node.js environment
    globals: true, // Enable global test functions
    watch: true,
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
