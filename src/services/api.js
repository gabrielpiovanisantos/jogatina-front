// Serviço centralizado para chamadas à API
import { MOCK_PLAYERS, MOCK_RANKING, MOCK_FACCOES, MOCK_FACCOES_OFICIAIS, desempenhoFaccaoMock, faccoesDoJogadorMock, gerarMesasMock, mockTemDadosNoPeriodo } from './mockData.js';
import { limitesDoPeriodo, PERIODO_PADRAO } from '../utils/periodo.js';
import { dataNoFuturo } from '../utils/datas.js';

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

// "?from=...&to=..." dos dashboards para o período (veja utils/periodo.js).
// Limite aberto não vai na URL; sem nenhum dos dois, o backend usa todo o histórico.
const consultaDoPeriodo = (periodo) => {
  const { from, to } = limitesDoPeriodo(periodo);
  const params = new URLSearchParams();
  if (from) params.set('from', from.toISOString());
  if (to) params.set('to', to.toISOString());
  const texto = params.toString();
  return texto ? `?${texto}` : '';
};

// Erro com o status HTTP, para a tela distinguir um 404 dos demais erros
const erroHttp = (status, mensagem) => Object.assign(new Error(mensagem), { status });

// Períodos salvos no modo mock, com as mesmas regras do backend
let periodosMock = [
  { id: 1, name: 'Temporada 1', from: new Date(2025, 10, 1).toISOString(), to: new Date(2026, 3, 1).toISOString() },
  { id: 2, name: 'Temporada 2', from: new Date(2026, 3, 1).toISOString(), to: null }
];

const validarPeriodoMock = ({ name, from, to }, idAtual) => {
  const nome = String(name ?? '').trim();
  if (!nome) return 'Nome do período não pode ser vazio';
  if (nome.length > 100) return 'Nome do período pode ter no máximo 100 caracteres';
  if (periodosMock.some(p => p.id !== idAtual && p.name.toLowerCase() === nome.toLowerCase())) {
    return `Já existe um período com o nome: ${nome}`;
  }
  if (!from) return "'from' é obrigatório";
  if (to && new Date(from) >= new Date(to)) return "'from' precisa ser anterior a 'to'";
  return null;
};

const ordenarPeriodosMock = () => [...periodosMock]
  .sort((a, b) => new Date(b.from) - new Date(a.from))
  .map(p => ({ ...p }));

// Envia um período salvo (POST/PUT) e devolve o objeto gravado
const enviarPeriodo = async (url, method, periodo, acao) => {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: periodo.name, from: periodo.from, to: periodo.to ?? null })
  });

  if (!response.ok) {
    // 400 traz a mensagem em text/plain; 404 vem sem corpo
    const errorMsg = await response.text();
    throw erroHttp(response.status, errorMsg || `Erro ${response.status} ao ${acao} período`);
  }

  return await response.json();
};


// Mesas compartilhadas no modo mock: só vivem nesta aba (não dá para testar o
// compartilhamento entre navegadores sem o backend).
const mesasMock = new Map();
let proximoJogadorMock = 1;

const copiaMesaMock = (mesa) => ({ ...mesa, players: mesa.players.map(p => ({ ...p })) });

const mesaMockOu404 = (id) => {
  const mesa = mesasMock.get(id);
  if (!mesa) throw erroHttp(404, 'Mesa não encontrada');
  return mesa;
};

// Chamada às mesas compartilhadas (/api/setup/tables): 400 traz a mensagem em
// text/plain e 404 vem sem corpo; o erro leva o status para a tela distinguir.
const chamarMesa = async (caminho, method = 'GET', corpo) => {
  const response = await fetch(`${API_BASE_URL}/api/setup/tables${caminho}`, {
    method,
    ...(corpo !== undefined && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo)
    })
  });

  if (!response.ok) {
    const errorMsg = response.status === 404 ? 'Mesa não encontrada' : await response.text();
    throw erroHttp(response.status, errorMsg || `Erro ${response.status} na mesa`);
  }

  return await response.json();
};

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
   * Cria uma mesa compartilhada; o id vai no link (#setup/<id>) para outras
   * pessoas adicionarem os nomes.
   * @param {{ data: string, jogo: string, quantidade: number }} dados - data em "AAAA-MM-DD"
   * @returns {Promise} { id, date, game, expectedPlayers, players: [] }
   */
  criarMesa: async ({ data, jogo, quantidade }) => {
    if (USE_MOCK_DATA) {
      await aguardar();
      const id = Math.random().toString(36).slice(2, 12);
      mesasMock.set(id, { id, date: data, game: jogo, expectedPlayers: quantidade, players: [] });
      return copiaMesaMock(mesasMock.get(id));
    }
    return chamarMesa('', 'POST', { date: data, game: jogo, expectedPlayers: quantidade });
  },

  /** Mesa compartilhada pelo id, com os nomes já adicionados (erro com status 404 se não existe) */
  obterMesa: async (id) => {
    if (USE_MOCK_DATA) return copiaMesaMock(mesaMockOu404(id));
    return chamarMesa(`/${encodeURIComponent(id)}`);
  },

  /** Adiciona um nome à mesa e devolve a mesa atualizada */
  adicionarJogadorNaMesa: async (id, nome) => {
    if (USE_MOCK_DATA) {
      await aguardar(150);
      const mesa = mesaMockOu404(id);
      const limpo = nome.trim();
      if (mesa.players.some(p => p.name.toLowerCase() === limpo.toLowerCase())) {
        throw erroHttp(400, 'Esse jogador já está na lista!');
      }
      mesa.players.push({ id: proximoJogadorMock++, name: limpo });
      return copiaMesaMock(mesa);
    }
    return chamarMesa(`/${encodeURIComponent(id)}/players`, 'POST', { name: nome });
  },

  /** Remove um nome da mesa (pelo id que veio da mesa) e devolve a mesa atualizada */
  removerJogadorDaMesa: async (id, jogadorId) => {
    if (USE_MOCK_DATA) {
      await aguardar(150);
      const mesa = mesaMockOu404(id);
      mesa.players = mesa.players.filter(p => p.id !== jogadorId);
      return copiaMesaMock(mesa);
    }
    return chamarMesa(`/${encodeURIComponent(id)}/players/${jogadorId}`, 'DELETE');
  },

  /** Organiza os nomes da mesa compartilhada em mesas de jogo: { groups } */
  organizarMesaCompartilhada: async (id) => {
    if (USE_MOCK_DATA) {
      await aguardar();
      const mesa = mesaMockOu404(id);
      if (mesa.players.length < 3) throw erroHttp(400, 'É necessário pelo menos 3 jogadores para organizar mesas');
      return { groups: gerarMesasMock(mesa.players) };
    }
    return chamarMesa(`/${encodeURIComponent(id)}/organize`, 'POST');
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
   * Lista os períodos salvos, compartilhados por todos
   * @returns {Promise} [{ id, name, from, to }], com to null para um período em andamento,
   * do início mais recente para o mais antigo
   */
  listarPeriodosSalvos: async () => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em listarPeriodosSalvos');
      await aguardar(150);
      return ordenarPeriodosMock();
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/periods`, { method: 'GET' });

      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao listar períodos salvos`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao listar períodos salvos:', error);
      throw error;
    }
  },

  /**
   * Cria um período salvo
   * @param {Object} periodo - { name, from, to } com from/to em ISO; to null ou ausente fica em aberto
   * @returns {Promise} O período criado, com id
   */
  criarPeriodoSalvo: async (periodo) => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em criarPeriodoSalvo', periodo);
      await aguardar(150);
      const erro = validarPeriodoMock(periodo, null);
      if (erro) throw erroHttp(400, erro);
      const novo = {
        id: Math.max(0, ...periodosMock.map(p => p.id)) + 1,
        name: periodo.name.trim(), from: periodo.from, to: periodo.to ?? null
      };
      periodosMock = [...periodosMock, novo];
      return { ...novo };
    }

    try {
      return await enviarPeriodo(`${API_BASE_URL}/api/periods`, 'POST', periodo, 'criar');
    } catch (error) {
      console.error('Erro ao criar período:', error);
      throw error;
    }
  },

  /**
   * Substitui um período salvo (to ausente vira null)
   * @param {Number} id - Id do período
   * @param {Object} periodo - { name, from, to }
   * @returns {Promise} O período atualizado
   */
  atualizarPeriodoSalvo: async (id, periodo) => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em atualizarPeriodoSalvo', id, periodo);
      await aguardar(150);
      if (!periodosMock.some(p => p.id === id)) throw erroHttp(404, `Erro 404 ao atualizar período`);
      const erro = validarPeriodoMock(periodo, id);
      if (erro) throw erroHttp(400, erro);
      const atualizado = { id, name: periodo.name.trim(), from: periodo.from, to: periodo.to ?? null };
      periodosMock = periodosMock.map(p => (p.id === id ? atualizado : p));
      return { ...atualizado };
    }

    try {
      return await enviarPeriodo(`${API_BASE_URL}/api/periods/${id}`, 'PUT', periodo, 'atualizar');
    } catch (error) {
      console.error('Erro ao atualizar período:', error);
      throw error;
    }
  },

  /**
   * Exclui um período salvo
   * @param {Number} id - Id do período
   */
  excluirPeriodoSalvo: async (id) => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em excluirPeriodoSalvo', id);
      await aguardar(150);
      if (!periodosMock.some(p => p.id === id)) throw erroHttp(404, `Erro 404 ao excluir período`);
      periodosMock = periodosMock.filter(p => p.id !== id);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/periods/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw erroHttp(response.status, `Erro ${response.status} ao excluir período`);
      }
    } catch (error) {
      console.error('Erro ao excluir período:', error);
      throw error;
    }
  },

  /**
   * Obtém o ranking de todos os jogadores
   * @param {String} [periodo] - Período do dashboard (utils/periodo.js); padrão: todo o histórico
   * @returns {Promise} Lista de jogadores com suas posições no ranking. Com período, quem não
   * jogou nele vem com zeros
   */
  obterRanking: async (periodo = PERIODO_PADRAO) => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em obterRanking');
      await aguardar();
      if (!mockTemDadosNoPeriodo(limitesDoPeriodo(periodo))) {
        return MOCK_RANKING.map(j => ({ ...j, totalScore: 0, totalGames: 0, totalVictories: 0, differentFactions: 0 }));
      }
      return MOCK_RANKING.map(jogador => ({ ...jogador }));
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/ranking${consultaDoPeriodo(periodo)}`, {
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
   * @param {String} [periodo] - Período do dashboard; padrão: todo o histórico
   * @returns {Promise} Dados de ranking do jogador, com factions: [{ faction, totalGames, totalVictories, winPercentage, totalScore, averageScore }] já ordenadas pelo backend
   */
  obterRankingJogador: async (playerId, periodo = PERIODO_PADRAO) => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em obterRankingJogador');
      await aguardar();
      const jogador = MOCK_RANKING.find(j => String(j.playerId) === String(playerId));
      if (!jogador) {
        throw erroHttp(404, `Jogador ${playerId} não encontrado`);
      }
      if (!mockTemDadosNoPeriodo(limitesDoPeriodo(periodo))) {
        return { ...jogador, totalScore: 0, totalGames: 0, totalVictories: 0, differentFactions: 0, factions: [] };
      }
      return { ...jogador, factions: faccoesDoJogadorMock(jogador) };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/ranking/${playerId}${consultaDoPeriodo(periodo)}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw erroHttp(response.status, `Erro ${response.status} ao obter ranking do jogador`);
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
   * @param {String} [periodo] - Período do dashboard; padrão: todo o histórico
   * @returns {Promise} Lista de { faction, totalGames, totalVictories, winPercentage, totalScore, averageScore, distinctPlayers }, já ordenada pelo backend
   */
  listarFaccoes: async (periodo = PERIODO_PADRAO) => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em listarFaccoes');
      await aguardar();
      if (!mockTemDadosNoPeriodo(limitesDoPeriodo(periodo))) return [];
      return MOCK_FACCOES.map(faccao => ({ ...faccao }));
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/factions${consultaDoPeriodo(periodo)}`, {
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
   * @param {String} [periodo] - Período do dashboard; padrão: todo o histórico. Facção sem
   * partidas no período também responde 404
   * @returns {Promise} Os mesmos campos de listarFaccoes e mais players: [{ playerId, playerName, totalGames, totalVictories, winPercentage, totalScore, averageScore }]
   */
  obterFaccao: async (faccao, periodo = PERIODO_PADRAO) => {
    if (USE_MOCK_DATA) {
      console.info('[api] Usando dados estáticos (mock) em obterFaccao');
      await aguardar();
      const detalhe = desempenhoFaccaoMock(faccao);
      if (!detalhe || !mockTemDadosNoPeriodo(limitesDoPeriodo(periodo))) {
        throw erroHttp(404, `Facção ${faccao} não encontrada`);
      }
      return detalhe;
    }

    try {
      // Nomes de facção têm espaços. Um "/" no nome não funciona no path (limitação do backend).
      const response = await fetch(`${API_BASE_URL}/dashboard/factions/${encodeURIComponent(faccao)}${consultaDoPeriodo(periodo)}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw erroHttp(response.status, `Erro ${response.status} ao obter facção`);
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
      // Mesma ordem do backend: a data vem antes das facções
      if (dataNoFuturo(payload.dateTime)) {
        throw new Error('Data da partida não pode estar no futuro');
      }
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

