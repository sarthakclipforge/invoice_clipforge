import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-512-maskable.png',
      ],
      manifest: {
        name: 'InvoiceKit',
        short_name: 'InvoiceKit',
        description: 'Professional invoices — create, manage, and export from anywhere.',
        theme_color: '#2563EB',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/dashboard',
        scope: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache all build output (JS bundles, CSS, HTML, images, fonts)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Do NOT cache Supabase API calls — they must stay network-first
        // The offline fallback for Supabase is handled in application code (IndexedDB)
        navigateFallback: '/index.html',

        runtimeCaching: [
          // Google Fonts stylesheet — stale-while-revalidate (short-lived)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          // Google Fonts files — cache first, long-lived (fonts never change at a URL)
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})
