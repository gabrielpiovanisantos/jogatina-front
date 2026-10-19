// Helpers compartilhados pelos testes de integração (Vitest) e E2E (Playwright)
// para falar com a stack de teste definida em docker-compose.test.yml.
import pg from 'pg';

export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:18080';

const DB_CONFIG = {
  host: process.env.TEST_DB_HOST ?? 'localhost',
  port: Number(process.env.TEST_DB_PORT ?? 15432),
  database: process.env.TEST_DB_NAME ?? 'jogatina_test',
  user: process.env.TEST_DB_USER ?? 'jogatina',
  password: process.env.TEST_DB_PASSWORD ?? 'jogatina'
};

async function comBanco(fn) {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/**
 * Falha cedo, com uma mensagem útil, se a stack de teste não estiver no ar.
 */
export async function aguardarBackend({ tentativas = 30, intervaloMs = 1000 } = {}) {
  for (let i = 0; i < tentativas; i++) {
    try {
      const response = await fetch(`${BACKEND_URL}/actuator/health`);
      if (response.ok && (await response.json()).status === 'UP') return;
    } catch {
      // backend ainda subindo
    }
    await new Promise(resolve => setTimeout(resolve, intervaloMs));
  }
  throw new Error(
    `Backend não respondeu em ${BACKEND_URL}. Suba a stack de teste com: npm run stack:test:up`
  );
}

/**
 * Apaga todos os dados. Tabelas conforme db/migration/V1__init.sql do backend:
 * "game_results" guarda as partidas (entidade Game) e "games" os resultados
 * de cada jogador (entidade GameResult).
 */
export function limparBanco() {
  return comBanco(client =>
    client.query('TRUNCATE games, game_results, players RESTART IDENTITY CASCADE')
  );
}

/**
 * Insere jogadores e partidas direto no Postgres. O backend não expõe um
 * endpoint para criar jogadores, então o banco é o caminho para montar um
 * cenário (partidas também vão direto, para manter as datas sob controle).
 *
 * @param {{ jogadores: string[], partidas: { data: string, resultados: { jogador: string, faccao: string, pontos: number, venceu: boolean }[] }[] }} cenario
 * @returns {Promise<Record<string, number>>} id gerado para cada nome de jogador
 */
export function semear({ jogadores, partidas = [] }) {
  return comBanco(async client => {
    const ids = {};
    for (const nome of jogadores) {
      const { rows } = await client.query('INSERT INTO players (name) VALUES ($1) RETURNING id', [nome]);
      ids[nome] = Number(rows[0].id);
    }
    for (const partida of partidas) {
      const { rows } = await client.query(
        'INSERT INTO games (date) VALUES ($1) RETURNING id',
        [partida.data]
      );
      for (const r of partida.resultados) {
        await client.query(
          'INSERT INTO game_results (game_id, player_id, score, faction, won) VALUES ($1, $2, $3, $4, $5)',
          [rows[0].id, ids[r.jogador], r.pontos, r.faccao, r.venceu]
        );
      }
    }
    return ids;
  });
}
