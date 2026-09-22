import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Two bundles: the public landing and the gated app.
// nginx serves the landing to everyone; the app bundle only when a gate cookie is present.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    outDir: mode === 'landing' ? 'dist/landing' : 'dist/app',
    rollupOptions: {
      input: mode === 'landing' ? 'landing.html' : 'index.html',
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/labs': { target: 'http://localhost:6000', changeOrigin: true },
    },
  },
}))
