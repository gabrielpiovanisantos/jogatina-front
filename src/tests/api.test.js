import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import apiService from '../services/api.js';
import { definirPeriodosSalvos } from '../utils/periodo.js';

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

    it('given a player with factions when getting a player ranking then returns them in the backend order', async () => {
      const ranking = {
        playerId: 1, playerName: 'Ana', totalVictories: 2, totalGames: 3, winPercentage: 66.66666666666666, differentFactions: 2, totalScore: 75,
        factions: [
          { faction: 'Malandro', totalGames: 1, totalVictories: 0, winPercentage: 0.0, totalScore: 20, averageScore: 20.0 },
          { faction: 'Marqueses', totalGames: 2, totalVictories: 2, winPercentage: 100.0, totalScore: 55, averageScore: 27.5 }
        ]
      };
      globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => ranking });

      const resultado = await apiService.obterRankingJogador(1);

      // A ordem é responsabilidade do backend: a função não reordena
      expect(resultado.factions.map(f => f.faction)).toEqual(['Malandro', 'Marqueses']);
    });

    it('given an unknown player when the backend responds 404 then throws', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(apiService.obterRankingJogador(999)).rejects.toThrow('Erro 404 ao obter ranking do jogador');
    });
  });

  describe('listarFaccoesOficiais', () => {
    it('given the official list when listing it then sends a GET to /api/factions and returns the names in order', async () => {
      const nomes = ['Marqueses', 'Dinastia das Rapinas', 'Aliança da Floresta'];
      globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => nomes });

      const resultado = await apiService.listarFaccoesOficiais();

      const [url, opcoes] = globalThis.fetch.mock.calls[0];
      expect(new URL(url, 'http://base').pathname).toBe('/api/factions');
      expect(opcoes).toEqual(expect.objectContaining({ method: 'GET' }));
      expect(resultado).toEqual(nomes);
    });

    it('given an error response when listing the official factions then throws', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(apiService.listarFaccoesOficiais()).rejects.toThrow('Erro 500 ao listar as facções oficiais');
    });
  });

  describe('listarFaccoes', () => {
    it('given faction results when listing factions then sends a GET to /dashboard/factions and returns them', async () => {
      const faccoes = [
        { faction: 'Stark', totalGames: 4, totalVictories: 3, winPercentage: 75.0, totalScore: 120, averageScore: 30.0, distinctPlayers: 2 }
      ];
      globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => faccoes });

      const resultado = await apiService.listarFaccoes();

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      const [url, opcoes] = globalThis.fetch.mock.calls[0];
      expect(new URL(url, 'http://base').pathname).toBe('/dashboard/factions');
      expect(opcoes).toEqual(expect.objectContaining({ method: 'GET' }));
      expect(resultado).toEqual(faccoes);
    });

    it('given no results when listing factions then returns an empty array', async () => {
      globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      await expect(apiService.listarFaccoes()).resolves.toEqual([]);
    });

    it('given an error response when listing factions then throws', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(apiService.listarFaccoes()).rejects.toThrow('Erro 500 ao listar facções');
    });
  });

  describe('obterFaccao', () => {
    it('given a faction when getting it then sends a GET to /dashboard/factions/{faction} and returns the detail', async () => {
      const detalhe = {
        faction: 'Stark', totalGames: 4, totalVictories: 3, winPercentage: 75.0, totalScore: 120, averageScore: 30.0, distinctPlayers: 2,
        players: [{ playerId: 1, playerName: 'Alice', totalGames: 3, totalVictories: 3, winPercentage: 100.0, totalScore: 90, averageScore: 30.0 }]
      };
      globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => detalhe });

      const resultado = await apiService.obterFaccao('Stark');

      const [url, opcoes] = globalThis.fetch.mock.calls[0];
      expect(new URL(url, 'http://base').pathname).toBe('/dashboard/factions/Stark');
      expect(opcoes).toEqual(expect.objectContaining({ method: 'GET' }));
      expect(resultado).toEqual(detalhe);
    });

    it('given a faction name with spaces and accents when getting it then encodes the name in the path', async () => {
      globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      await apiService.obterFaccao('Aliança da Floresta');

      expect(globalThis.fetch.mock.calls[0][0]).toEqual(
        expect.stringContaining('/dashboard/factions/Alian%C3%A7a%20da%20Floresta')
      );
    });

    it('given an unknown faction when the backend responds 404 then throws', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(apiService.obterFaccao('Lannister')).rejects.toThrow('Erro 404 ao obter facção');
    });
  });

  describe('dashboard period', () => {
    const urlChamada = () => new URL(globalThis.fetch.mock.calls[0][0], 'http://base');

    beforeEach(() => {
      globalThis.fetch.mockResolvedValue({ ok: true, json: async () => [] });
    });

    it('given no period when calling the dashboards then sends no from or to', async () => {
      await apiService.obterRanking();
      expect(urlChamada().search).toBe('');
    });

    it('given "tudo" when calling the dashboards then sends no from or to', async () => {
      await apiService.listarFaccoes('tudo');
      expect(urlChamada().search).toBe('');
    });

    it('given a shortcut when calling the dashboards then sends only from, as an ISO instant', async () => {
      await apiService.obterRanking('ano');

      const params = urlChamada().searchParams;
      expect(params.get('from')).toBe(new Date(new Date().getFullYear(), 0, 1).toISOString());
      expect(params.has('to')).toBe(false);
    });

    it.each([
      ['obterRanking', () => apiService.obterRanking('2026-01-10_2026-03-31'), '/dashboard/ranking'],
      ['obterRankingJogador', () => apiService.obterRankingJogador(7, '2026-01-10_2026-03-31'), '/dashboard/ranking/7'],
      ['listarFaccoes', () => apiService.listarFaccoes('2026-01-10_2026-03-31'), '/dashboard/factions'],
      ['obterFaccao', () => apiService.obterFaccao('Aliança da Floresta', '2026-01-10_2026-03-31'), '/dashboard/factions/Alian%C3%A7a%20da%20Floresta']
    ])('given a custom range when calling %s then sends from and to [from, to) in the path query', async (_, chamar, caminho) => {
      await chamar();

      const url = urlChamada();
      expect(url.pathname).toBe(caminho);
      expect(url.searchParams.get('from')).toBe(new Date(2026, 0, 10).toISOString());
      expect(url.searchParams.get('to')).toBe(new Date(2026, 3, 1).toISOString());
    });

    it('given a 404 when getting a faction then the error carries the status', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch.mockReset();
      globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(apiService.obterFaccao('Marqueses', '3m')).rejects.toMatchObject({ status: 404 });
    });

    it('given a 400 for an inverted range when getting the ranking then throws with the status', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch.mockReset();
      globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 400 });

      await expect(apiService.obterRanking('3m')).rejects.toThrow('Erro 400 ao obter ranking');
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
        { playerId: 1, faction: 'Marqueses', points: 30, won: true },
        { playerId: 2, faction: 'Malandro', points: 22, won: false }
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

    it.each([
      'Facção inválida: Stark',
      'Facção inválida: Stark, Lannister'
    ])('given the backend rejects with 400 "%s" when registering then throws with that message', async (mensagem) => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 400, text: async () => mensagem });

      await expect(apiService.registrarPartida(payload)).rejects.toThrow(mensagem);
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

  describe('saved periods (temporadas) → /api/periods', () => {
    const TEMPORADA = { id: 7, name: 'Temporada 3', from: '2026-10-01T03:00:00.000Z', to: null };
    const urlEMetodo = () => {
      const [url, opcoes] = globalThis.fetch.mock.calls[0];
      return [new URL(url, 'http://base').pathname, opcoes.method];
    };

    afterEach(() => definirPeriodosSalvos([]));

    it('given saved periods when listing them then sends a GET to /api/periods', async () => {
      globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => [TEMPORADA] });

      expect(await apiService.listarPeriodosSalvos()).toEqual([TEMPORADA]);
      expect(urlEMetodo()).toEqual(['/api/periods', 'GET']);
    });

    it('given a new period when creating it then POSTs name, from and a null to, and returns the created object', async () => {
      globalThis.fetch.mockResolvedValueOnce({ ok: true, status: 201, json: async () => TEMPORADA });

      const criada = await apiService.criarPeriodoSalvo({ name: 'Temporada 3', from: TEMPORADA.from });

      expect(urlEMetodo()).toEqual(['/api/periods', 'POST']);
      const opcoes = globalThis.fetch.mock.calls[0][1];
      expect(opcoes.headers).toEqual(expect.objectContaining({ 'Content-Type': 'application/json' }));
      expect(JSON.parse(opcoes.body)).toEqual({ name: 'Temporada 3', from: TEMPORADA.from, to: null });
      expect(criada).toEqual(TEMPORADA);
    });

    it('given a period when updating it then PUTs the whole object to /api/periods/{id}', async () => {
      const atualizada = { ...TEMPORADA, to: '2026-12-01T03:00:00.000Z' };
      globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => atualizada });

      expect(await apiService.atualizarPeriodoSalvo(7, atualizada)).toEqual(atualizada);
      expect(urlEMetodo()).toEqual(['/api/periods/7', 'PUT']);
      expect(JSON.parse(globalThis.fetch.mock.calls[0][1].body)).toEqual({ name: 'Temporada 3', from: TEMPORADA.from, to: atualizada.to });
    });

    it('given a period when deleting it then sends a DELETE to /api/periods/{id}', async () => {
      globalThis.fetch.mockResolvedValueOnce({ ok: true, status: 204 });

      await apiService.excluirPeriodoSalvo(7);

      expect(urlEMetodo()).toEqual(['/api/periods/7', 'DELETE']);
    });

    it.each([
      'Nome do período não pode ser vazio',
      'Já existe um período com o nome: Temporada 3',
      "'from' precisa ser anterior a 'to'"
    ])('given the backend rejects with 400 "%s" when creating then throws that message', async (mensagem) => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 400, text: async () => mensagem });

      await expect(apiService.criarPeriodoSalvo({ name: 'x', from: TEMPORADA.from })).rejects.toMatchObject({ message: mensagem, status: 400 });
    });

    it.each([
      ['atualizarPeriodoSalvo', () => apiService.atualizarPeriodoSalvo(99, TEMPORADA), 'Erro 404 ao atualizar período'],
      ['excluirPeriodoSalvo', () => apiService.excluirPeriodoSalvo(99), 'Erro 404 ao excluir período']
    ])('given an unknown id when calling %s then throws a 404', async (_, chamar, mensagem) => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 404, text: async () => '' });

      await expect(chamar()).rejects.toMatchObject({ message: mensagem, status: 404 });
    });

    it('given a saved period is selected when calling the dashboards then sends its from and to', async () => {
      definirPeriodosSalvos([
        { id: 1, name: 'Temporada 1', from: '2025-11-01T03:00:00.000Z', to: '2026-04-01T03:00:00.000Z' },
        TEMPORADA
      ]);
      globalThis.fetch.mockResolvedValue({ ok: true, json: async () => [] });

      await apiService.obterRanking('salvo:1');
      await apiService.listarFaccoes('salvo:7');

      const [comFim, emAndamento] = globalThis.fetch.mock.calls.map(([url]) => new URL(url, 'http://base').searchParams);
      expect(comFim.get('from')).toBe('2025-11-01T03:00:00.000Z');
      expect(comFim.get('to')).toBe('2026-04-01T03:00:00.000Z');
      expect(emAndamento.get('from')).toBe(TEMPORADA.from);
      expect(emAndamento.has('to')).toBe(false);
    });
  });
});
