// Dados estáticos usados enquanto o backend não está disponível.
// Mantidos centralizados aqui para que Setup, Ranking, Dashboard e
// RegistrarPartida enxerguem sempre os mesmos jogadores.

export const MOCK_PLAYERS = [
  { id: 1, name: 'João' },
  { id: 2, name: 'Maria' },
  { id: 3, name: 'Carlos' },
  { id: 4, name: 'Ana' },
  { id: 5, name: 'Pedro' },
  { id: 6, name: 'Fernanda' },
  { id: 7, name: 'Bruno' },
  { id: 8, name: 'Isabela' }
];

export const MOCK_PLAYER_NAMES = MOCK_PLAYERS.map(p => p.name);

// Mesmo formato do PlayerRankingDTO do backend, já ordenado por vitórias e
// depois pontos, como o backend faria.
export const MOCK_RANKING = [
  { playerId: 1, playerName: 'João', totalScore: 48, totalGames: 14, totalVictories: 8, differentFactions: 5 },
  { playerId: 6, playerName: 'Fernanda', totalScore: 41, totalGames: 12, totalVictories: 6, differentFactions: 4 },
  { playerId: 3, playerName: 'Carlos', totalScore: 37, totalGames: 15, totalVictories: 5, differentFactions: 6 },
  { playerId: 2, playerName: 'Maria', totalScore: 33, totalGames: 10, totalVictories: 5, differentFactions: 3 },
  { playerId: 5, playerName: 'Pedro', totalScore: 29, totalGames: 11, totalVictories: 4, differentFactions: 4 },
  { playerId: 8, playerName: 'Isabela', totalScore: 22, totalGames: 8, totalVictories: 3, differentFactions: 3 },
  { playerId: 4, playerName: 'Ana', totalScore: 18, totalGames: 9, totalVictories: 2, differentFactions: 4 },
  { playerId: 7, playerName: 'Bruno', totalScore: 15, totalGames: 7, totalVictories: 1, differentFactions: 2 }
];

// Mesmo formato de GET /dashboard/factions, já ordenado como o backend faria:
// winPercentage, totalVictories e totalGames decrescentes, depois o nome.
export const MOCK_FACCOES = [
  { faction: 'Marqueses', totalGames: 18, totalVictories: 6, winPercentage: 33.3, totalScore: 432, averageScore: 24.0, distinctPlayers: 6 },
  { faction: 'Aliança da Floresta', totalGames: 12, totalVictories: 4, winPercentage: 33.3, totalScore: 276, averageScore: 23.0, distinctPlayers: 5 },
  { faction: 'Dinastia das Rapinas', totalGames: 16, totalVictories: 5, winPercentage: 31.3, totalScore: 352, averageScore: 22.0, distinctPlayers: 6 },
  { faction: 'Malandro', totalGames: 14, totalVictories: 4, winPercentage: 28.6, totalScore: 294, averageScore: 21.0, distinctPlayers: 5 },
  { faction: 'Companhia Ribeirinha', totalGames: 8, totalVictories: 2, winPercentage: 25.0, totalScore: 164, averageScore: 20.5, distinctPlayers: 4 },
  { faction: 'Guardiões de Ferro', totalGames: 4, totalVictories: 1, winPercentage: 25.0, totalScore: 80, averageScore: 20.0, distinctPlayers: 3 },
  { faction: 'Senhor das Centenas', totalGames: 5, totalVictories: 1, winPercentage: 20.0, totalScore: 98, averageScore: 19.6, distinctPlayers: 3 },
  { faction: 'Lagartos Cultistas', totalGames: 6, totalVictories: 1, winPercentage: 16.7, totalScore: 117, averageScore: 19.5, distinctPlayers: 3 },
  { faction: 'Ducado Subterrâneo', totalGames: 7, totalVictories: 1, winPercentage: 14.3, totalScore: 133, averageScore: 19.0, distinctPlayers: 4 },
  { faction: 'Conspiração Corvídea', totalGames: 5, totalVictories: 0, winPercentage: 0.0, totalScore: 85, averageScore: 17.0, distinctPlayers: 3 }
];

const arredondar = (n) => Math.round(n * 10) / 10;

// Detalhe de GET /dashboard/factions/{faction} em modo mock. Como no backend,
// o nome ignora maiúsculas e espaços nas pontas. Os números por jogador são
// ilustrativos e não fecham com o total da facção.
export const desempenhoFaccaoMock = (faction) => {
  const chave = String(faction).trim().toLowerCase();
  const resumo = MOCK_FACCOES.find(f => f.faction.toLowerCase() === chave);
  if (!resumo) return null;
  const players = MOCK_RANKING.slice(0, 4).map((jogador, i) => {
    const totalGames = Math.max(1, Math.round(resumo.totalGames / (i + 2)));
    const totalVictories = Math.min(totalGames, Math.max(0, resumo.totalVictories - i - 1));
    const averageScore = arredondar(resumo.averageScore + 2 - i);
    return {
      playerId: jogador.playerId,
      playerName: jogador.playerName,
      totalGames,
      totalVictories,
      winPercentage: arredondar((totalVictories / totalGames) * 100),
      totalScore: Math.round(averageScore * totalGames),
      averageScore
    };
  });
  return { ...resumo, players };
};

/**
 * Simula o algoritmo de organização de mesas do backend,
 * distribuindo os jogadores confirmados em grupos.
 * Garante que nenhuma mesa fique com menos que `minimoMesa` jogadores,
 * reduzindo o número de mesas e redistribuindo o restante quando necessário.
 */
export function gerarMesasMock(jogadores, tamanhoMesa = 4, minimoMesa = 3) {
  const n = jogadores.length;
  if (n === 0) return [];

  let numMesas = Math.max(1, Math.ceil(n / tamanhoMesa));
  while (numMesas > 1 && Math.floor(n / numMesas) < minimoMesa) {
    numMesas--;
  }

  const tamanhoBase = Math.floor(n / numMesas);
  let resto = n % numMesas;

  const grupos = [];
  let indice = 0;
  for (let i = 0; i < numMesas; i++) {
    const tamanho = tamanhoBase + (resto > 0 ? 1 : 0);
    if (resto > 0) resto--;
    grupos.push(jogadores.slice(indice, indice + tamanho));
    indice += tamanho;
  }
  return grupos;
}
