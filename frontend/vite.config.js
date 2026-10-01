import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tailwind v4 is compiled through postcss.config.js.
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // Lets the app call the API as a same-origin `/api/*` path in development,
    // which sidesteps CORS entirely. See src/lib/apiClient.js.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  build: {
    // Routes are lazy-loaded in src/App.jsx, so chunks stay well under this.
    chunkSizeWarningLimit: 700,
    sourcemap: false,
  },
})
