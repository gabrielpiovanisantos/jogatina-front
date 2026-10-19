import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // O Vitest 1.x roda sobre o Vite 5 interno, onde o @vitejs/plugin-react 6
  // não configura o JSX; sem isso o esbuild usa o runtime clássico e exige
  // `import React` em todo arquivo .jsx.
  esbuild: { jsx: 'automatic' },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    // tests/ tem as suítes de integração e E2E, que precisam do backend real
    // (npm run test:integration / npm run test:e2e).
    exclude: [...configDefaults.exclude, 'tests/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js', 'src/**/*.jsx'],
      exclude: ['src/main.jsx', 'src/tests/**']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});

