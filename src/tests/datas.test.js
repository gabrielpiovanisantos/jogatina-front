import { describe, it, expect } from 'vitest';
import { dataNoFuturo, TOLERANCIA_FUTURO_MS } from '../utils/datas.js';

// A mesma regra do POST /api/games/finish, usada pelo modo mock
describe('dataNoFuturo', () => {
  const agora = new Date(2026, 9, 26, 15, 30);
  const mais = (ms) => new Date(agora.getTime() + ms).toISOString();

  it('given now or the past when checking then accepts it', () => {
    expect(dataNoFuturo(agora.toISOString(), agora)).toBe(false);
    expect(dataNoFuturo(mais(-24 * 60 * 60 * 1000), agora)).toBe(false);
  });

  it('given exactly now + 5 minutes when checking then still accepts it', () => {
    expect(TOLERANCIA_FUTURO_MS).toBe(5 * 60 * 1000);
    expect(dataNoFuturo(mais(TOLERANCIA_FUTURO_MS), agora)).toBe(false);
  });

  it('given one millisecond past now + 5 minutes when checking then rejects it', () => {
    expect(dataNoFuturo(mais(TOLERANCIA_FUTURO_MS + 1), agora)).toBe(true);
  });

  it('given tomorrow when checking then rejects it', () => {
    expect(dataNoFuturo(new Date(2026, 9, 27, 0, 0).toISOString(), agora)).toBe(true);
  });
});
