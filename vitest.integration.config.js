import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Testes de integração: o frontend (apiService e páginas renderizadas em
// jsdom) fala com o backend real da stack de teste via fetch de verdade.
// Pré-requisito: npm run stack:test:up
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:18080';

export default defineConfig({
  plugins: [react()],
  // Runtime automático do JSX: os testes não precisam importar React.
  esbuild: { jsx: 'automatic' },
  test: {
    globals: true,
    include: ['tests/integration/**/*.int.test.{js,jsx}'],
    setupFiles: ['./tests/integration/setup.js'],
    // Todos os arquivos compartilham o mesmo banco de teste.
    fileParallelism: false,
    testTimeout: 15000,
    env: {
      VITE_API_URL: BACKEND_URL,
      BACKEND_URL
    }
  }
});
