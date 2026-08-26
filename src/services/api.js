// Serviço centralizado para chamadas à API
import { MOCK_RANKING, gerarMesasMock } from './mockData.js';

const API_BASE_URL = import.meta.env.VITE_API_URL ?
  (import.meta.env.VITE_API_URL === '/' ? '' : import.meta.env.VITE_API_URL) :
  'http://localhost:8080';

// Dados estáticos ligados por padrão para permitir testar a interface sem
// backend rodando. Para conectar ao backend real, defina VITE_USE_MOCK=false
// no .env. Nos testes automatizados (vitest) o mock fica sempre desligado,
// pois os testes mockam o fetch diretamente.
const USE_MOCK_DATA = import.meta.env.MODE !== 'test' && import.meta.env.VITE_USE_MOCK !== 'false';

const aguardar = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

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
   * @returns {Promise} Dados de ranking do jogador
   */
  obterRankingJogador: async (playerId) => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em obterRankingJogador');
      await aguardar();
      const jogador = MOCK_RANKING.find(j => String(j.playerId) === String(playerId));
      if (!jogador) {
        throw new Error(`Jogador ${playerId} não encontrado`);
      }
      return { ...jogador };
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
   * Registra o resultado de uma partida finalizada
   * @param {Object} payload - { dateTime, results: [{ playerId, faction, points, won }] }
   * @returns {Promise} Confirmação do registro
   */
  registrarPartida: async (payload) => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em registrarPartida', payload);
      await aguardar();
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
  }
};

export default apiService;

