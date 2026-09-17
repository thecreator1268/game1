/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// The live demo deploys to GitHub Pages under a repo subpath
// (https://<user>.github.io/game1/), not domain root — base/start_url/scope
// all need to agree on that subpath, or routing and the PWA manifest break
// in production while looking fine in local dev (which serves from '/').
// Overridable via BASE_PATH so `vite build` still defaults to '/' locally.
const BASE_PATH = process.env.BASE_PATH ?? '/';

// https://vite.dev/config/
export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png', 'audio/**/*', 'images/**/*'],
      manifest: {
        name: 'SmritiSetu — Memory Bridge',
        short_name: 'SmritiSetu',
        description:
          'Offline-first cognitive gaming and memory assistance for elderly dementia patients in NER India.',
        theme_color: '#0d5c5c',
        background_color: '#fffaf0',
        display: 'standalone',
        orientation: 'any',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        icons: [
          { src: `${BASE_PATH}icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${BASE_PATH}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: `${BASE_PATH}icons/icon-maskable-192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: `${BASE_PATH}icons/icon-maskable-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2,mp3,webp}'],
        // Runtime caching keeps every game/audio/photo asset available fully offline,
        // which is the core constraint of this app (see README). Patterns are
        // base-relative since a GitHub Pages deploy serves everything under
        // a repo subpath, not domain root.
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith(`${BASE_PATH}audio/`),
            handler: 'CacheFirst',
            options: { cacheName: 'audio-assets' },
          },
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith(`${BASE_PATH}images/`),
            handler: 'CacheFirst',
            options: { cacheName: 'image-assets' },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
