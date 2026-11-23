import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      injectRegister: "auto",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,mp3}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/resource/images/") ||
              url.pathname.startsWith("/resource/audio/"),
            handler: "CacheFirst",
            options: {
              cacheName: "media-cache",
              cacheableResponse: {
                statuses: [0, 200],
              },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
  // server: {
  // allowedHosts: ["livable-elsewhere-elyse.ngrok-free.dev", "http://localhost:8000"],
  //   proxy: {
  //     '/api': {
  //       target: "http://localhost:8000",
  //       changeOrigin: true,
  //       rewrite: (path) => path.replace(/^\/api/, ''),
  //     },
  //     '/resource': {
  //       target: "http://localhost:8000",
  //       changeOrigin: true,
  //     },
  //     '/ws': {
  //       target: "ws://localhost:8000",
  //       ws: true,
  //     },
  //   },
  // },
});
