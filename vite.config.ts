import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    solidPlugin(),
    VitePWA({
      injectRegister: "auto",
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      workbox: {
        navigateFallbackDenylist: [/^\/ads\.txt/],
      },
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
});
