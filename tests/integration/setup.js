import '@testing-library/jest-dom/vitest';
import { beforeAll, vi } from 'vitest';
import { aguardarBackend } from '../support/backend.js';

// Diferente de src/tests/setup.js, aqui o fetch NÃO é mockado: as chamadas
// vão para o backend real.
globalThis.alert = vi.fn();

beforeAll(() => aguardarBackend());
