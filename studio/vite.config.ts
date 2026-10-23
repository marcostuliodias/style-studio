import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { api } from './api.mjs';

// The Studio's web app: a Vite root in studio/, serving the engine's public/ (fonts, footage) and importing the
// engine's source from ../src. Two pages: index.html (the panel) and preview.html (the iframe that mounts the engine).
const root = fileURLToPath(new URL('.', import.meta.url));

/** The Studio's API (studio/api.mjs) on the dev server: skill, render, footage, tone, and the rendered videos. */
const studioApi = (): Plugin => ({
  name: 'studio-api',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      void api(req, res, next);
    });
  },
});

export default defineConfig({
  root,
  publicDir: '../public',
  plugins: [react(), studioApi()],
  define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development') },
  server: { port: 3490, strictPort: true, fs: { allow: ['..'] } },
  build: {
    outDir: '../dist-studio',
    emptyOutDir: true,
    rollupOptions: { input: { studio: fileURLToPath(new URL('./index.html', import.meta.url)), preview: fileURLToPath(new URL('./preview.html', import.meta.url)) } },
  },
});
