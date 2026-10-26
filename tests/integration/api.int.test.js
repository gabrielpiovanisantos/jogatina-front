// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import apiService from '../../src/services/api.js';
import { limparBanco, semear } from '../support/backend.js';
import { CENARIO_RANKING, RANKING_ESPERADO } from '../support/cenario.js';

const jogadores = n => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Jogador ${i + 1}` }));

describe('apiService ↔ real backend', () => {
  beforeEach(() => limparBanco());

  describe('organizarMesas → POST /api/setup/organize', () => {
    it.each([
      [3, [3]],
      [4, [4]],
      [5, [5]],
      [6, [3, 3]],
      [7, [4, 3]],
      [9, [5, 4]],
      [10, [5, 5]],
      [13, [5, 4, 4]],
      [20, [4, 4, 4, 4, 4]]
    ])('given %i players when organizing then splits them into tables of %j', async (n, tamanhos) => {
      const enviados = jogadores(n);

      const { groups } = await apiService.organizarMesas(enviados);

      expect(groups.map(g => g.length)).toEqual(tamanhos);
      expect(groups.flat()).toHaveLength(n);
      expect(new Set(groups.flat().map(j => j.name))).toEqual(new Set(enviados.map(j => j.name)));
    });

    it('given new names with SetupMesa ids (Date.now()) when organizing then registers them and returns the database ids', async () => {
      const base = Date.now();
      const enviados = ['Ana', 'Bruno', 'Carla'].map((name, i) => ({ id: base + i, name }));

      const { groups } = await apiService.organizarMesas(enviados);

      expect(groups).toEqual([[{ id: 1, name: 'Ana' }, { id: 2, name: 'Bruno' }, { id: 3, name: 'Carla' }]]);
    });

    it('given a registered player when organizing with the name in another case then reuses the player', async () => {
      const ids = await semear({ jogadores: ['Ana'] });

      const { groups } = await apiService.organizarMesas([
        { id: 1, name: ' ana ' }, { id: 2, name: 'Bruno' }, { id: 3, name: 'Carla' }
      ]);

      expect(groups[0][0]).toEqual({ id: ids.Ana, name: 'Ana' });
    });

    it('given fewer than 3 players when organizing then rejects with the backend validation message', async () => {
      await expect(apiService.organizarMesas(jogadores(2)))
        .rejects.toThrow('É necessário pelo menos 3 jogadores para organizar mesas');
    });

    it('given a blank name when organizing then rejects with the backend error', async () => {
      const enviados = [...jogadores(2), { id: 3, name: '   ' }];

      await expect(apiService.organizarMesas(enviados))
        .rejects.toThrow('Nome de jogador não pode ser vazio');
    });

    it('given a repeated name when organizing then rejects with the backend error', async () => {
      const enviados = [...jogadores(3), { id: 4, name: 'JOGADOR 1' }];

      await expect(apiService.organizarMesas(enviados))
        .rejects.toThrow('Jogador repetido na lista');
    });
  });

  describe('listarJogadores → GET /api/players', () => {
    it('given players registered by organizarMesas when listing players then returns them in alphabetical order', async () => {
      await apiService.organizarMesas([
        { id: 1, name: 'Carla' }, { id: 2, name: 'Ana' }, { id: 3, name: 'Bruno' }
      ]);

      const lista = await apiService.listarJogadores();

      expect(lista.map(j => j.name)).toEqual(['Ana', 'Bruno', 'Carla']);
      expect(lista.every(j => Number.isInteger(j.id))).toBe(true);
    });

    it('given no players when listing players then returns an empty list', async () => {
      expect(await apiService.listarJogadores()).toEqual([]);
    });
  });

  describe('obterRanking → GET /dashboard/ranking', () => {
    it('given no players when getting the ranking then returns an empty list', async () => {
      expect(await apiService.obterRanking()).toEqual([]);
    });

    it('given played games when getting the ranking then returns it calculated and sorted by the backend', async () => {
      await semear(CENARIO_RANKING);

      const ranking = await apiService.obterRanking();

      expect(ranking).toMatchObject(RANKING_ESPERADO);
    });

    it('given played games when getting the ranking then exposes the fields Ranking and Dashboard read', async () => {
      await semear(CENARIO_RANKING);

      const [primeiro] = await apiService.obterRanking();

      expect(primeiro).toEqual({
        playerId: expect.any(Number),
        playerName: 'Ana',
        totalVictories: 2,
        totalGames: 3,
        winPercentage: expect.closeTo(66.67, 1),
        differentFactions: 3,
        totalScore: 83
      });
    });
  });

  describe('obterRankingJogador → GET /dashboard/ranking/{id}', () => {
    it('given played games when getting a player ranking then returns that player statistics', async () => {
      const ids = await semear(CENARIO_RANKING);

      const bruno = await apiService.obterRankingJogador(ids.Bruno);

      expect(bruno).toMatchObject({ playerId: ids.Bruno, ...RANKING_ESPERADO[1] });
    });

    it('given an unknown player when getting a player ranking then rejects with a 404', async () => {
      // O backend responde 404 com corpo vazio para jogador inexistente.
      await expect(apiService.obterRankingJogador(999)).rejects.toThrow('Erro 404 ao obter ranking do jogador');
    });
  });

  describe('registrarPartida → POST /api/games/finish', () => {
    it('given registered players when finishing a game then it counts in the ranking', async () => {
      const ids = await semear({ jogadores: ['Ana', 'Bruno', 'Carla'] });

      await apiService.registrarPartida({
        dateTime: '2026-10-01T20:00:00Z',
        results: [
          { playerId: ids.Ana, faction: 'Marqueses', points: 30, won: true },
          { playerId: ids.Bruno, faction: 'Malandro', points: 20, won: false },
          { playerId: ids.Carla, faction: 'Lagartos Cultistas', points: 12, won: false }
        ]
      });

      const ranking = await apiService.obterRanking();
      expect(ranking[0]).toMatchObject({ playerName: 'Ana', totalVictories: 1, totalScore: 30 });
    });
  });
});
