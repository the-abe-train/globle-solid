import { defineConfig, type Plugin } from 'vite';
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

/**
 * Vite plugin that injects onerror handlers on built module script tags
 * so stale-asset failures trigger the boot recovery in index.html.
 */
function moduleRecoveryPlugin(): Plugin {
  return {
    name: 'module-recovery',
    transformIndexHtml(html) {
      return html.replace(
        /<script\s+type="module"[^>]*src="[^"]*"[^>]*>/g,
        (tag) => {
          if (tag.includes('onerror')) return tag;
          return tag.replace(
            '>',
            ` onerror="window.__globleRecoverFromBootFailure && window.__globleRecoverFromBootFailure('entry-module-load-error')">`,
          );
        },
      );
    },
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  plugins: [solidPlugin(), moduleRecoveryPlugin()],
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
