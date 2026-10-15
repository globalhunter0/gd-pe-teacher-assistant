import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Free Safari PWA companion. Deployed under GitHub Pages `/mobile/`. */
export default defineConfig({
  root: resolve('src/webHost'),
  base: '/gd-pe-teacher-assistant/mobile/',
  publicDir: resolve('src/webHost/public'),
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src'),
      '@shared': resolve('src/shared'),
      '@assets': resolve('src/assets')
    }
  },
  build: {
    outDir: resolve('docs/mobile'),
    emptyOutDir: true,
    sourcemap: false
  },
  server: {
    port: 5175,
    fs: {
      allow: [resolve('.'), resolve('src')]
    }
  }
})
