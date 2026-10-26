// Cenário de dados usado pelos testes de ranking/dashboard, com o resultado
// que o RankingService do backend deve calcular para ele.
//
// Os jogadores são inseridos fora da ordem do ranking (Eva primeiro) para
// garantir que a ordenação vem do backend e não da ordem de inserção.

export const CENARIO_RANKING = {
  jogadores: ['Eva', 'Carla', 'Ana', 'Diego', 'Bruno'],
  partidas: [
    {
      data: '2026-09-01T20:00:00Z',
      resultados: [
        { jogador: 'Ana', faccao: 'Marqueses', pontos: 30, venceu: true },
        { jogador: 'Bruno', faccao: 'Dinastia das Rapinas', pontos: 22, venceu: false },
        { jogador: 'Carla', faccao: 'Aliança da Floresta', pontos: 18, venceu: false }
      ]
    },
    {
      data: '2026-09-08T20:00:00Z',
      resultados: [
        { jogador: 'Ana', faccao: 'Dinastia das Rapinas', pontos: 25, venceu: false },
        { jogador: 'Bruno', faccao: 'Malandro', pontos: 30, venceu: true },
        { jogador: 'Carla', faccao: 'Marqueses', pontos: 20, venceu: false },
        { jogador: 'Diego', faccao: 'Lagartos Cultistas', pontos: 10, venceu: false }
      ]
    },
    {
      data: '2026-09-15T20:00:00Z',
      resultados: [
        { jogador: 'Ana', faccao: 'Malandro', pontos: 28, venceu: true },
        { jogador: 'Carla', faccao: 'Companhia Ribeirinha', pontos: 15, venceu: false },
        { jogador: 'Diego', faccao: 'Lagartos Cultistas', pontos: 12, venceu: false }
      ]
    }
  ]
};

// Ordenado como o backend ordena: vitórias, depois pontuação total.
export const RANKING_ESPERADO = [
  { playerName: 'Ana', totalVictories: 2, totalGames: 3, differentFactions: 3, totalScore: 83 },
  { playerName: 'Bruno', totalVictories: 1, totalGames: 2, differentFactions: 2, totalScore: 52 },
  { playerName: 'Carla', totalVictories: 0, totalGames: 3, differentFactions: 3, totalScore: 53 },
  { playerName: 'Diego', totalVictories: 0, totalGames: 2, differentFactions: 1, totalScore: 22 },
  { playerName: 'Eva', totalVictories: 0, totalGames: 0, differentFactions: 0, totalScore: 0 }
];
