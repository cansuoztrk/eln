import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// Relative base so the static build can be hosted from any sub-path
// (GitHub Pages, a CDN folder, or opened from a static file server).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    proxy: {
      // Optional AI Architect proxy (see server/architect-proxy.mjs). Only used when
      // VITE_ARCHITECT_ENDPOINT=/api/architect is set.
      '/api': 'http://localhost:8787',
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
