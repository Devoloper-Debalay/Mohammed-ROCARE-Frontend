import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Production is served from https://just24you.com/ecommerce/, not the
  // domain root, so built asset URLs need that prefix. Dev server stays at
  // root so `npm run dev` is unaffected.
  base: command === 'build' ? '/ecommerce/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
