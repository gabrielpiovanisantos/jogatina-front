// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import apiService from '../../src/services/api.js';
import { limparBanco, semear } from '../support/backend.js';
import { CENARIO_RANKING, RANKING_ESPERADO } from '../support/cenario.js';

const jogadores = n => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Jogador ${i + 1}` }));

describe('apiService ↔ backend real', () => {
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
    ])('distribui %i jogadores em mesas de %j', async (n, tamanhos) => {
      const enviados = jogadores(n);

      const { groups } = await apiService.organizarMesas(enviados);

      expect(groups.map(g => g.length)).toEqual(tamanhos);
      expect(groups.flat()).toHaveLength(n);
      expect(new Set(groups.flat().map(j => j.id))).toEqual(new Set(enviados.map(j => j.id)));
    });

    it('aceita os ids gerados pelo SetupMesa (Date.now())', async () => {
      const base = Date.now();
      const enviados = ['Ana', 'Bruno', 'Carla'].map((name, i) => ({ id: base + i, name }));

      const { groups } = await apiService.organizarMesas(enviados);

      expect(groups).toEqual([enviados]);
    });

    it('propaga a mensagem de validação do backend com menos de 3 jogadores', async () => {
      await expect(apiService.organizarMesas(jogadores(2)))
        .rejects.toThrow('É necessário pelo menos 3 jogadores para organizar mesas');
    });

    it('propaga erro para nome em branco', async () => {
      const enviados = [...jogadores(2), { id: 3, name: '   ' }];

      await expect(apiService.organizarMesas(enviados))
        .rejects.toThrow('Nome de jogador não pode ser vazio');
    });

    it('propaga erro para ids duplicados', async () => {
      const enviados = [...jogadores(3), { id: 1, name: 'Clone' }];

      await expect(apiService.organizarMesas(enviados))
        .rejects.toThrow('IDs de jogadores duplicados');
    });
  });

  describe('obterRanking → GET /dashboard/ranking', () => {
    it('retorna lista vazia sem jogadores cadastrados', async () => {
      expect(await apiService.obterRanking()).toEqual([]);
    });

    it('retorna o ranking calculado e ordenado pelo backend', async () => {
      await semear(CENARIO_RANKING);

      const ranking = await apiService.obterRanking();

      expect(ranking).toMatchObject(RANKING_ESPERADO);
    });

    it('expõe os campos que Ranking e Dashboard leem', async () => {
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
    it('retorna as estatísticas de um jogador', async () => {
      const ids = await semear(CENARIO_RANKING);

      const bruno = await apiService.obterRankingJogador(ids.Bruno);

      expect(bruno).toMatchObject({ playerId: ids.Bruno, ...RANKING_ESPERADO[1] });
    });

    it('rejeita quando o jogador não existe', async () => {
      // O backend responde 200 com corpo vazio (o controller retorna null),
      // então hoje o erro que chega ao frontend é de parse do JSON, não um 404.
      await expect(apiService.obterRankingJogador(999)).rejects.toThrow();
    });
  });

  describe('registrarPartida → POST /api/games/finish', () => {
    it('registra a partida e ela passa a contar no ranking', async () => {
      const ids = await semear({ jogadores: ['Ana', 'Bruno', 'Carla'] });

      await apiService.registrarPartida({
        dateTime: '2026-10-01T20:00:00Z',
        results: [
          { playerId: ids.Ana, faction: 'Marquise de Cat', points: 30, won: true },
          { playerId: ids.Bruno, faction: 'Vagabond', points: 20, won: false },
          { playerId: ids.Carla, faction: 'Lizard Cult', points: 12, won: false }
        ]
      });

      const ranking = await apiService.obterRanking();
      expect(ranking[0]).toMatchObject({ playerName: 'Ana', totalVictories: 1, totalScore: 30 });
    });
  });
});
