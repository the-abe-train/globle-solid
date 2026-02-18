import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { readFileSync } from 'fs';

// Read version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [solidPlugin()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
  test: {
    // Enable VS Code Test Explorer integration
    reporters: ['default', 'json'],
    outputFile: './tests/vitest-result.json',
  },
});
