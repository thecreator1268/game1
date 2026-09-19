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

// Link-preview crawlers (WhatsApp, Slack, X) need an absolute og:image URL.
// The deploy workflow overrides this from the repo owner/name; the default
// is the current live demo so a local `vite build` still emits valid tags.
const SITE_URL = process.env.SITE_URL ?? 'https://thecreator1268.github.io/game1/';

// https://vite.dev/config/
export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    {
      name: 'site-url-html',
      // 'pre' so this runs before Vite's own %ENV_VAR% pass, which would
      // otherwise warn about %SITE_URL% not being a defined env var.
      transformIndexHtml: {
        order: 'pre',
        handler: (html: string) => html.replaceAll('%SITE_URL%', SITE_URL),
      },
    },
    VitePWA({
      // 'prompt', not 'autoUpdate': a new build waits until the person taps
      // "Refresh" (see UpdateToast) instead of swapping under them mid-game.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/*.png', 'audio/**/*', 'images/**/*'],
      manifest: {
        name: 'SmritiSetu — Memory Bridge',
        short_name: 'SmritiSetu',
        description:
          'Offline-first cognitive gaming and memory assistance for elderly dementia patients in NER India.',
        theme_color: '#F5F4ED',
        background_color: '#F5F4ED',
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
        // The OCR engine files are matched by the .js glob above purely by
        // extension but are handled by the runtimeCaching rule below
        // instead — eagerly precaching them would push a multi-MB
        // caregiver-only download onto every install, and the largest one
        // exceeds Workbox's default 2MB precache size cap anyway.
        globIgnores: ['**/tesseract/**', '**/og-image.png'],
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
          {
            // Self-hosted Tesseract.js OCR engine + English model for the
            // medicine-label scanner (RemindersManager). Deliberately NOT in
            // includeAssets/globPatterns — these are ~7MB and caregiver-only,
            // so a patient's install never downloads them; they're cached
            // the first time a caregiver actually opens "Scan Medicine
            // Label", then fully available offline from then on.
            urlPattern: ({ url }: { url: URL }) =>
              url.pathname.startsWith(`${BASE_PATH}tesseract/`) ||
              url.pathname.startsWith(`${BASE_PATH}tessdata/`),
            handler: 'CacheFirst',
            options: { cacheName: 'ocr-assets' },
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
