import { describe, it, expect, afterEach } from 'vitest';
import {
  limitesDoPeriodo, periodoValido, diasDoPeriodo, temFiltro, descreverPeriodo, periodoPersonalizado, jogadoresDoPeriodo,
  definirPeriodosSalvos, periodoSalvo, periodoSalvoDe, ehPeriodoSalvo, datasDoPeriodo
} from '../utils/periodo.js';

// Datas locais: os limites são calculados no fuso do usuário
const hoje = new Date(2026, 9, 26, 15, 30); // 26/10/2026 15:30

describe('periodo utils', () => {
  it('given "tudo" when getting the limits then both are open', () => {
    expect(limitesDoPeriodo('tudo', hoje)).toEqual({ from: null, to: null });
  });

  it('given the last 3 months when getting the limits then starts at midnight of the same day 3 months ago, with an open end', () => {
    expect(limitesDoPeriodo('3m', hoje)).toEqual({ from: new Date(2026, 6, 26), to: null });
  });

  it('given the last 12 months when getting the limits then starts at midnight of the same day a year ago', () => {
    expect(limitesDoPeriodo('12m', hoje)).toEqual({ from: new Date(2025, 9, 26), to: null });
  });

  it('given the end of a month when going back 3 months then falls on the last day that exists', () => {
    expect(limitesDoPeriodo('3m', new Date(2026, 4, 31)).from).toEqual(new Date(2026, 1, 28));
  });

  it('given this year when getting the limits then starts on January 1st', () => {
    expect(limitesDoPeriodo('ano', hoje)).toEqual({ from: new Date(2026, 0, 1), to: null });
  });

  it('given a custom range when getting the limits then covers both days fully, ending at the next midnight', () => {
    expect(limitesDoPeriodo('2026-01-10_2026-03-31', hoje)).toEqual({
      from: new Date(2026, 0, 10),
      to: new Date(2026, 3, 1)
    });
  });

  it('given a single-day custom range when getting the limits then covers that day', () => {
    expect(limitesDoPeriodo(periodoPersonalizado('2026-10-26', '2026-10-26'), hoje)).toEqual({
      from: new Date(2026, 9, 26),
      to: new Date(2026, 9, 27)
    });
  });

  it.each([
    ['tudo', true],
    ['3m', true],
    ['2026-01-01_2026-02-01', true],
    ['2026-02-01_2026-01-01', false], // invertido
    ['2026-02-31_2026-03-01', false], // dia que não existe
    ['2026-01-01', false],
    ['2026-01-01_2026-02-01_2026-03-01', false],
    ['6m', false],
    ['', false]
  ])('given "%s" when validating then returns %s', (periodo, esperado) => {
    expect(periodoValido(periodo)).toBe(esperado);
  });

  it('given an invalid period when getting the limits then falls back to the whole history', () => {
    expect(limitesDoPeriodo('6m', hoje)).toEqual({ from: null, to: null });
  });

  it('given periods when checking for a filter then only "tudo" has none', () => {
    expect(temFiltro('tudo')).toBe(false);
    expect(temFiltro('ano')).toBe(true);
    expect(temFiltro('2026-01-01_2026-02-01')).toBe(true);
    expect(temFiltro('lixo')).toBe(false);
  });

  it('given periods when describing them then uses the label or the Brazilian dates', () => {
    expect(descreverPeriodo('3m')).toBe('últimos 3 meses');
    expect(descreverPeriodo('2026-01-10_2026-03-31')).toBe('de 10/01/2026 a 31/03/2026');
    expect(diasDoPeriodo('ano')).toBeNull();
  });

  it('given players with zero games when filtering by period then hides them only when there is a period', () => {
    const jogadores = [{ playerId: 1, totalGames: 3 }, { playerId: 2, totalGames: 0 }];

    expect(jogadoresDoPeriodo(jogadores, '3m')).toEqual([{ playerId: 1, totalGames: 3 }]);
    expect(jogadoresDoPeriodo(jogadores, 'tudo')).toEqual(jogadores);
  });

  describe('saved periods (temporadas)', () => {
    const SALVOS = [
      { id: 2, name: 'Temporada 2', from: new Date(2026, 3, 1).toISOString(), to: null },
      { id: 1, name: 'Temporada 1', from: new Date(2025, 10, 1).toISOString(), to: new Date(2026, 3, 1).toISOString() }
    ];

    afterEach(() => definirPeriodosSalvos([]));

    it('given registered saved periods when resolving "salvo:<id>" then uses their limits as instants', () => {
      definirPeriodosSalvos(SALVOS);

      expect(limitesDoPeriodo(periodoSalvo(1), hoje)).toEqual({ from: new Date(2025, 10, 1), to: new Date(2026, 3, 1) });
      expect(limitesDoPeriodo('salvo:2', hoje)).toEqual({ from: new Date(2026, 3, 1), to: null });
      expect(periodoValido('salvo:2')).toBe(true);
      expect(temFiltro('salvo:2')).toBe(true);
      expect(descreverPeriodo('salvo:1')).toBe('Temporada 1');
    });

    it('given an unknown or removed saved period when resolving then it is invalid and has no filter', () => {
      definirPeriodosSalvos(SALVOS);

      expect(ehPeriodoSalvo('salvo:99')).toBe(true);
      expect(periodoSalvoDe('salvo:99')).toBeNull();
      expect(periodoValido('salvo:99')).toBe(false);
      expect(limitesDoPeriodo('salvo:99', hoje)).toEqual({ from: null, to: null });
      expect(temFiltro('salvo:99')).toBe(false);
    });

    it('given the saved periods were not loaded yet when resolving then it is not valid yet', () => {
      expect(periodoValido('salvo:1')).toBe(false);
    });

    it('given periods when showing their dates then the end is the day before "to", or "hoje" when open', () => {
      definirPeriodosSalvos(SALVOS);

      expect(datasDoPeriodo('salvo:1', hoje)).toBe('01/11/2025 – 31/03/2026');
      expect(datasDoPeriodo('salvo:2', hoje)).toBe('01/04/2026 – hoje');
      expect(datasDoPeriodo('3m', hoje)).toBe('26/07/2026 – hoje');
      expect(datasDoPeriodo('2026-01-10_2026-03-31', hoje)).toBe('10/01/2026 – 31/03/2026');
      expect(datasDoPeriodo('tudo', hoje)).toBe('');
    });
  });
});
