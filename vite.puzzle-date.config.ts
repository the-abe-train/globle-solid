import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// An isolated browser fixture with no dotenv files or live service credentials.
export default defineConfig({
  envDir: false,
  plugins: [solid()],
  define: {
    __APP_VERSION__: JSON.stringify('test'),
    __BUILD_TIME__: JSON.stringify('2026-09-12T21:39:42Z'),
    'import.meta.env.VITE_CRYPTO_KEY': JSON.stringify('puzzle-date-test-key'),
  },
});
