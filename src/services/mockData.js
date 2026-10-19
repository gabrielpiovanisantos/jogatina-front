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
