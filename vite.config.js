import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Alvo do proxy /api e /dashboard. Os testes E2E apontam para a stack de
// teste (docker-compose.test.yml) via BACKEND_URL.
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false, // Se a porta estiver em uso, tenta a próxima
    proxy: {
      // Proxy para a API backend
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        rewrite: (path) => path // Mantém o path original
      },
      '/dashboard': {
        target: BACKEND_URL,
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})


