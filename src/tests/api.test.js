import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import apiService from '../services/api.js';

describe('API Service', () => {

  beforeEach(() => {
    // Resetar todos os mocks antes de cada teste
    vi.clearAllMocks();
    // Mock do fetch global
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('organizarMesas', () => {
    it('given players when organizing then sends a POST to /api/setup/organize', async () => {
      const jogadores = [
        { id: 1, name: 'João' },
        { id: 2, name: 'Maria' },
        { id: 3, name: 'Pedro' }
      ];

      const mockResponse = {
        groups: [
          [
            { id: 1, name: 'João' },
            { id: 3, name: 'Pedro' }
          ],
          [
            { id: 2, name: 'Maria' }
          ]
        ]
      };

      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const resultado = await apiService.organizarMesas(jogadores);

      // Verificar que fetch foi chamado corretamente
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/setup/organize'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      // Verificar que o resultado está correto
      expect(resultado).toEqual(mockResponse);
      expect(resultado.groups).toBeDefined();
      expect(resultado.groups).toHaveLength(2);
    });

    it('given a non ok response when organizing then throws', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const jogadores = [{ id: 1, name: 'João' }];

      globalThis.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Erro: Entrada inválida'
      });

      await expect(apiService.organizarMesas(jogadores)).rejects.toThrow();
    });

    it('given players when organizing then sends them in the request body', async () => {
      const jogadores = [
        { id: 1, name: 'João' },
        { id: 2, name: 'Maria' }
      ];

      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ groups: [] })
      });

      await apiService.organizarMesas(jogadores);

      const callArgs = globalThis.fetch.mock.calls[0];
      const bodyString = callArgs[1].body;
      const body = JSON.parse(bodyString);

      expect(body).toEqual({ players: jogadores });
    });
  });

  describe('listarPartidas', () => {
    it('given a range when listing games then sends a GET to /api/games with from and to as ISO instants', async () => {
      const partidas = [{ id: 4, dateTime: '2026-10-19T18:00:00Z' }];
      globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => partidas });

      const resultado = await apiService.listarPartidas(
        new Date('2026-10-19T03:00:00Z'),
        new Date('2026-10-20T03:00:00Z')
      );

      const url = new URL(globalThis.fetch.mock.calls[0][0], 'http://base');
      expect(url.pathname).toBe('/api/games');
      expect(url.searchParams.get('from')).toBe('2026-10-19T03:00:00.000Z');
      expect(url.searchParams.get('to')).toBe('2026-10-20T03:00:00.000Z');
      expect(resultado).toEqual(partidas);
    });

    it('given an error response when listing games then throws', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(
        apiService.listarPartidas(new Date('2026-10-19T03:00:00Z'), new Date('2026-10-20T03:00:00Z'))
      ).rejects.toThrow('Erro 500 ao listar partidas');
    });
  });

  describe('obterRanking', () => {
    it('given the ranking when getting it then sends a GET to /dashboard/ranking', async () => {
      const mockRanking = [
        { id: 1, name: 'João', points: 1500, games: 10, wins: 7 },
        { id: 2, name: 'Maria', points: 1200, games: 8, wins: 5 }
      ];

      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRanking
      });

      const resultado = await apiService.obterRanking();

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      const callArgs = globalThis.fetch.mock.calls[0];
      expect(callArgs[0]).toEqual(expect.stringContaining('/dashboard/ranking'));
      if (callArgs[1]) {
        expect(callArgs[1]).not.toEqual(expect.objectContaining({ method: 'POST' }));
      }

      expect(resultado).toEqual(mockRanking);
      expect(resultado).toHaveLength(2);
    });

    it('given a ranking response when getting the ranking then returns the players with their fields', async () => {
      const mockRanking = [
        { id: 1, name: 'João', points: 1500, games: 10, wins: 7 }
      ];

      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRanking
      });

      const resultado = await apiService.obterRanking();

      expect(resultado[0]).toHaveProperty('id');
      expect(resultado[0]).toHaveProperty('name');
      expect(resultado[0]).toHaveProperty('points');
      expect(resultado[0]).toHaveProperty('games');
      expect(resultado[0]).toHaveProperty('wins');
    });

    it('given a failed request when getting the ranking then throws', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch.mockRejectedValueOnce(new Error('Conexão recusada'));

      await expect(apiService.obterRanking()).rejects.toThrow('Conexão recusada');
    });
  });

  describe('obterRankingJogador', () => {
    it('given a player id when getting a player ranking then sends a GET to /dashboard/ranking/{id}', async () => {
      const playerId = 1;
      const mockPlayerRanking = { id: 1, name: 'João', points: 1500, games: 10, wins: 7 };

      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlayerRanking
      });

      const resultado = await apiService.obterRankingJogador(playerId);

      const callArgs = globalThis.fetch.mock.calls[0];
      expect(callArgs[0]).toEqual(expect.stringContaining(`/dashboard/ranking/${playerId}`));

      expect(resultado).toEqual(mockPlayerRanking);
      expect(resultado.id).toBe(playerId);
    });

    it('given a numeric or string id when getting a player ranking then builds the same url', async () => {
      const mockPlayerRanking = { id: 1, name: 'João', points: 1500 };

      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockPlayerRanking
      });

      // Teste com número
      await apiService.obterRankingJogador(1);
      let callArgs1 = globalThis.fetch.mock.calls[0];
      expect(callArgs1[0]).toEqual(expect.stringContaining('/dashboard/ranking/1'));

      // Teste com string
      await apiService.obterRankingJogador('1');
      let callArgs2 = globalThis.fetch.mock.calls[1];
      expect(callArgs2[0]).toEqual(expect.stringContaining('/dashboard/ranking/1'));
    });

    it('given an unknown player when the backend responds 404 then throws', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(apiService.obterRankingJogador(999)).rejects.toThrow('Erro 404 ao obter ranking do jogador');
    });
  });

  describe('listarJogadores', () => {
    it('given registered players when listing players then sends a GET to /api/players and returns them', async () => {
      const jogadores = [{ id: 1, name: 'Ana' }, { id: 2, name: 'Bruno' }];
      globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => jogadores });

      const resultado = await apiService.listarJogadores();

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      const [url, opcoes] = globalThis.fetch.mock.calls[0];
      expect(new URL(url, 'http://base').pathname).toBe('/api/players');
      expect(opcoes).toEqual(expect.objectContaining({ method: 'GET' }));
      expect(resultado).toEqual(jogadores);
    });

    it('given an error response when listing players then throws', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(apiService.listarJogadores()).rejects.toThrow('Erro 500 ao listar jogadores');
    });
  });

  describe('registrarPartida', () => {
    const payload = {
      dateTime: '2026-10-19T20:00:00.000Z',
      results: [
        { playerId: 1, faction: 'Marquise de Cat', points: 30, won: true },
        { playerId: 2, faction: 'Vagabond', points: 22, won: false }
      ]
    };

    it('given a game when registering it then sends a POST to /api/games/finish with the payload as JSON', async () => {
      globalThis.fetch.mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ gameId: 7 }) });

      const resultado = await apiService.registrarPartida(payload);

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      const [url, opcoes] = globalThis.fetch.mock.calls[0];
      expect(new URL(url, 'http://base').pathname).toBe('/api/games/finish');
      expect(opcoes.method).toBe('POST');
      expect(opcoes.headers).toEqual(expect.objectContaining({ 'Content-Type': 'application/json' }));
      expect(JSON.parse(opcoes.body)).toEqual(payload);
      expect(resultado).toEqual({ success: true });
    });

    it('given a backend validation error when registering then throws with the backend message', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Jogador repetido na mesma partida'
      });

      await expect(apiService.registrarPartida(payload)).rejects.toThrow('Jogador repetido na mesma partida');
    });

    it('given an error response without a body when registering then throws with the status', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => '' });

      await expect(apiService.registrarPartida(payload)).rejects.toThrow('Erro 500 ao registrar partida');
    });
  });

  describe('Error handling', () => {
    it('given a network error when getting the ranking then logs it to the console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      globalThis.fetch.mockRejectedValueOnce(new Error('Erro de rede'));

      await expect(apiService.obterRanking()).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('given an empty response when getting the ranking then returns an empty array', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const resultado = await apiService.obterRanking();

      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado).toHaveLength(0);
    });
  });

  describe('Request headers', () => {
    it('given a POST request when organizing then sends Content-Type application/json', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ groups: [] })
      });

      await apiService.organizarMesas([]);

      const headers = globalThis.fetch.mock.calls[0][1].headers;
      expect(headers['Content-Type']).toBe('application/json');
    });
  });
});

