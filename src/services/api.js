// Serviço centralizado para chamadas à API
import { MOCK_PLAYERS, MOCK_RANKING, MOCK_FACCOES, MOCK_FACCOES_OFICIAIS, desempenhoFaccaoMock, faccoesDoJogadorMock, gerarMesasMock } from './mockData.js';

const API_BASE_URL = import.meta.env.VITE_API_URL ?
  (import.meta.env.VITE_API_URL === '/' ? '' : import.meta.env.VITE_API_URL) :
  'http://localhost:8080';

// Dados estáticos ligados por padrão para permitir testar a interface sem
// backend rodando. Para conectar ao backend real, defina VITE_USE_MOCK=false
// no .env. Nos testes automatizados (vitest) o mock fica sempre desligado,
// pois os testes mockam o fetch diretamente.
const USE_MOCK_DATA = import.meta.env.MODE !== 'test' && import.meta.env.VITE_USE_MOCK !== 'false';

const aguardar = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

// Partidas "registradas" no modo mock, para a numeração do dia avançar.
const partidasMock = [];

export const apiService = {
  /**
   * Organiza os jogadores em mesas de acordo com o algoritmo do backend
   * @param {Array} jogadores - Lista de jogadores com { id, name }
   * @returns {Promise} Resposta com os grupos de jogadores organizados
   */
  organizarMesas: async (jogadores) => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em organizarMesas');
      await aguardar();
      return { groups: gerarMesasMock(jogadores) };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/setup/organize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: jogadores })
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || `Erro ${response.status} ao organizar mesas`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao organizar mesas:', error);
      throw error;
    }
  },

  /**
   * Lista os jogadores cadastrados (cadastrados ao organizar mesas)
   * @returns {Promise} Lista de { id, name } em ordem alfabética
   */
  listarJogadores: async () => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em listarJogadores');
      await aguardar();
      return MOCK_PLAYERS.map(jogador => ({ ...jogador }));
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/players`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao listar jogadores`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao listar jogadores:', error);
      throw error;
    }
  },

  /**
   * Lista as facções aceitas pelo backend (a lista oficial)
   * @returns {Promise} Nomes das facções, na ordem oficial
   */
  listarFaccoesOficiais: async () => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em listarFaccoesOficiais');
      await aguardar();
      return [...MOCK_FACCOES_OFICIAIS];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/factions`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao listar as facções oficiais`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao listar as facções oficiais:', error);
      throw error;
    }
  },

  /**
   * Obtém o ranking de todos os jogadores
   * @returns {Promise} Lista de jogadores com suas posições no ranking
   */
  obterRanking: async () => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em obterRanking');
      await aguardar();
      return MOCK_RANKING.map(jogador => ({ ...jogador }));
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/ranking`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao obter ranking`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao obter ranking:', error);
      throw error;
    }
  },

  /**
   * Obtém o ranking de um jogador específico
   * @param {Number|String} playerId - ID do jogador
   * @returns {Promise} Dados de ranking do jogador, com factions: [{ faction, totalGames, totalVictories, winPercentage, totalScore, averageScore }] já ordenadas pelo backend
   */
  obterRankingJogador: async (playerId) => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em obterRankingJogador');
      await aguardar();
      const jogador = MOCK_RANKING.find(j => String(j.playerId) === String(playerId));
      if (!jogador) {
        throw new Error(`Jogador ${playerId} não encontrado`);
      }
      return { ...jogador, factions: faccoesDoJogadorMock(jogador) };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/ranking/${playerId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao obter ranking do jogador`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao obter ranking do jogador:', error);
      throw error;
    }
  },

  /**
   * Obtém o desempenho de todas as facções
   * @returns {Promise} Lista de { faction, totalGames, totalVictories, winPercentage, totalScore, averageScore, distinctPlayers }, já ordenada pelo backend
   */
  listarFaccoes: async () => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em listarFaccoes');
      await aguardar();
      return MOCK_FACCOES.map(faccao => ({ ...faccao }));
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/factions`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao listar facções`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao listar facções:', error);
      throw error;
    }
  },

  /**
   * Obtém o desempenho de uma facção, com o detalhe por jogador
   * @param {String} faccao - Nome da facção (o backend ignora maiúsculas e espaços nas pontas)
   * @returns {Promise} Os mesmos campos de listarFaccoes e mais players: [{ playerId, playerName, totalGames, totalVictories, winPercentage, totalScore, averageScore }]
   */
  obterFaccao: async (faccao) => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em obterFaccao');
      await aguardar();
      const detalhe = desempenhoFaccaoMock(faccao);
      if (!detalhe) {
        throw new Error(`Facção ${faccao} não encontrada`);
      }
      return detalhe;
    }

    try {
      // Nomes de facção têm espaços. Um "/" no nome não funciona no path (limitação do backend).
      const response = await fetch(`${API_BASE_URL}/dashboard/factions/${encodeURIComponent(faccao)}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao obter facção`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao obter facção:', error);
      throw error;
    }
  },

  /**
   * Registra o resultado de uma partida finalizada
   * @param {Object} payload - { dateTime, results: [{ playerId, faction, points, won }] }
   * @returns {Promise} Confirmação do registro
   */
  registrarPartida: async (payload) => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em registrarPartida', payload);
      await aguardar();
      // Mesma validação do backend: ignora maiúsculas e espaços nas pontas, acentos contam
      const oficiais = MOCK_FACCOES_OFICIAIS.map(f => f.toLowerCase());
      const invalidas = payload.results
        .map(r => String(r.faction).trim())
        .filter(f => !oficiais.includes(f.toLowerCase()));
      if (invalidas.length > 0) {
        throw new Error(`Facção inválida: ${invalidas.join(', ')}`);
      }
      partidasMock.push({ id: partidasMock.length + 1, dateTime: payload.dateTime });
      return { success: true, message: 'Partida registrada (mock)' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/games/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || `Erro ${response.status} ao registrar partida`);
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao registrar partida:', error);
      throw error;
    }
  },

  /**
   * Lista as partidas com data no intervalo [de, ate)
   * @param {Date} de - Início do intervalo (inclusivo)
   * @param {Date} ate - Fim do intervalo (exclusivo)
   * @returns {Promise} Lista de { id, dateTime }, da mais antiga para a mais recente
   */
  listarPartidas: async (de, ate) => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em listarPartidas');
      await aguardar(150);
      return partidasMock.filter(p => new Date(p.dateTime) >= de && new Date(p.dateTime) < ate);
    }

    try {
      const params = new URLSearchParams({ from: de.toISOString(), to: ate.toISOString() });
      const response = await fetch(`${API_BASE_URL}/api/games?${params}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao listar partidas`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao listar partidas:', error);
      throw error;
    }
  }
};

export default apiService;

