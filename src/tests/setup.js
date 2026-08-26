import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock do fetch global se necessário
global.fetch = vi.fn();
// Mock window.alert to avoid "Not implemented" errors in jsdom
global.alert = vi.fn();

