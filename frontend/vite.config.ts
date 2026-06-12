import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      // "@" points at the frontend root, e.g. `@/types/Product`, `@/components/...`
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})
