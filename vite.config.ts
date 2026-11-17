import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA  } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true
      },
      injectRegister: "auto",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,mp3}"]
      }
    })
  ],
  server: {
    // allowedHosts: ["livable-elsewhere-elyse.ngrok-free.dev"],
    proxy: {
      '/api': {
        target: 'https://livable-elsewhere-elyse.ngrok-free.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/resource': {
        target: 'https://livable-elsewhere-elyse.ngrok-free.dev',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://livable-elsewhere-elyse.ngrok-free.dev',
        ws: true,
      },
    },
  },
})
