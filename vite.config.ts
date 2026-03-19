import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { readFileSync, writeFileSync } from 'fs';

// Read version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const buildTime = new Date().toISOString();

// Write version.json to public so it's available at /version.json
writeFileSync(
  './public/version.json',
  JSON.stringify({ version: packageJson.version, buildTime }),
);

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_TIME__: JSON.stringify(buildTime),
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
