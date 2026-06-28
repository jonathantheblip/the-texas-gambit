import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Deployed as a GitHub Pages *project* site at /the-texas-gambit/.
// `base` makes built asset URLs resolve under that subpath; in dev it's '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/the-texas-gambit/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',     // Helen always gets the latest on next load
      injectRegister: 'auto',
      includeAssets: ['favicon-helen.svg', 'favicon-helen-180.png'],
      manifest: {
        name: 'Hill Country Estate',
        short_name: 'HCE',
        description: 'A render-forward 3D model of the Hill Country compound.',
        theme_color: '#1E3A8A',
        background_color: '#e9e5db',
        display: 'standalone',
        icons: [
          { src: 'favicon-helen-180.png', sizes: '180x180', type: 'image/png' },
          { src: 'favicon-helen-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        // Precache the app shell (so it's fully offline), but NOT the heavy
        // colored-pencil PNGs — those are cached at runtime as they're viewed.
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2,ico}'],
        navigateFallbackDenylist: [/\/lookbook_images\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/lookbook_images/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'renders',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
}));
