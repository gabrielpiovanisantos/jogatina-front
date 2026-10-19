import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock do fetch global se necessário
globalThis.fetch = vi.fn();
// Mock window.alert to avoid "Not implemented" errors in jsdom
globalThis.alert = vi.fn();

