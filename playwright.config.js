import { defineConfig, devices } from '@playwright/test';

// E2E: navegador real → Vite (mocks desligados) → proxy → backend real da
// stack de teste. Pré-requisito: npm run stack:test:up
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:18080';
const PORTA = 5174; // diferente do dev server padrão, que pode estar rodando com mocks

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.js',
  // Todos os testes compartilham o mesmo banco de teste.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: `npx vite --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: false,
    env: {
      VITE_USE_MOCK: 'false',
      VITE_API_URL: '/',
      BACKEND_URL
    }
  }
});
