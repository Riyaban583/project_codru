import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // 🚨 The Updated PWA Plugin configuration
    VitePWA({
      strategies: 'injectManifest', // Tells Vite: "I have my own Service Worker!"
      srcDir: 'src',                // Look in the 'src' folder
      filename: 'sw.js',            // The file is named 'sw.js'
      registerType: 'autoUpdate', 
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'], 

      manifest: {
        name: 'Codru Student Dashboard',
        short_name: 'Codru',
        description: 'Manage your syllabus and tasks',
        theme_color: '#ffffff',
        background_color: '#f8fafc', 
        display: 'standalone',
      },
      // 🚨 Renamed from 'workbox' to 'injectManifest'
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5000000
      },
      devOptions: {
        enabled: true, 
        type: 'module' // 🚨 Crucial for custom Service Workers in Dev mode!
      }
    })
  ],
  server: {
    proxy: {
      "/api": {
        target: "https://codru-server.vercel.app/api",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""), 
        secure: true,
      },
    },
  },
});