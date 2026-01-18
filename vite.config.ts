import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages - will be set via environment variable
  // For local dev: '/', For GitHub Pages: '/<repo-name>/'
  base: process.env.GITHUB_PAGES ? '/teleparty-chat-app/' : '/',
  optimizeDeps: {
    include: ['teleparty-websocket-lib'],
  },
  build: {
    commonjsOptions: {
      include: [/teleparty-websocket-lib/, /node_modules/],
    },
  },
})
