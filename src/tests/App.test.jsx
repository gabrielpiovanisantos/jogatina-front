import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import * as apiService from '../services/api.js';
import { definirPeriodosSalvos } from '../utils/periodo.js';

vi.mock('../services/api.js', () => ({
  default: {
    obterRanking: vi.fn(),
    obterRankingJogador: vi.fn(),
    listarFaccoes: vi.fn(),
    obterFaccao: vi.fn(),
    listarPeriodosSalvos: vi.fn(),
    criarPeriodoSalvo: vi.fn(),
    atualizarPeriodoSalvo: vi.fn(),
    excluirPeriodoSalvo: vi.fn()
  }
}));

const DETALHE = {
  faction: 'Aliança da Floresta', totalGames: 4, totalVictories: 3, winPercentage: 75.0, totalScore: 120, averageScore: 30.0, distinctPlayers: 2,
  players: []
};

describe('App faction navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiService.default.obterRanking.mockResolvedValue([]);
    apiService.default.obterRankingJogador.mockResolvedValue({ factions: [] });
    apiService.default.listarFaccoes.mockResolvedValue([DETALHE]);
    apiService.default.obterFaccao.mockResolvedValue(DETALHE);
    apiService.default.listarPeriodosSalvos.mockResolvedValue([]);
  });

  it('given the navbar when clicking Facções and then a faction then shows its detail and keeps it in the url', async () => {
    window.history.replaceState(null, '', '#jogadores');
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: '🛡️ Facções' }));
    expect(window.location.hash).toBe('#faccoes');

    await userEvent.click(await screen.findByRole('button', { name: 'Aliança da Floresta' }));
    expect(await screen.findByText(/Desempenho por jogador/i)).toBeInTheDocument();
    expect(apiService.default.obterFaccao).toHaveBeenCalledWith('Aliança da Floresta', 'tudo');
    expect(window.location.hash).toBe('#faccao/Alian%C3%A7a%20da%20Floresta');
  });

  it('given a player faction on the dashboard when clicking it then opens the faction detail', async () => {
    apiService.default.obterRanking.mockResolvedValue([
      { playerId: 1, playerName: 'Ana', totalGames: 4, differentFactions: 1, totalVictories: 3, totalScore: 120 }
    ]);
    apiService.default.obterRankingJogador.mockResolvedValue({
      playerId: 1, factions: [{ faction: 'Aliança da Floresta', totalGames: 4, totalVictories: 3, winPercentage: 75.0, totalScore: 120, averageScore: 30.0 }]
    });
    window.history.replaceState(null, '', '#jogadores');
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Aliança da Floresta' }));

    expect(await screen.findByText(/Desempenho por jogador/i)).toBeInTheDocument();
    expect(window.location.hash).toBe('#faccao/Alian%C3%A7a%20da%20Floresta');
  });

  it('given a faction in the url when loading then opens its detail', async () => {
    window.history.replaceState(null, '', '#faccao/Alian%C3%A7a%20da%20Floresta');
    render(<App />);

    expect(await screen.findByText(/Desempenho por jogador/i)).toBeInTheDocument();
    expect(apiService.default.obterFaccao).toHaveBeenCalledWith('Aliança da Floresta', 'tudo');
  });

  it('given a malformed faction in the url when loading then falls back to the first screen', () => {
    window.history.replaceState(null, '', '#faccao/%E0');
    render(<App />);

    expect(apiService.default.obterFaccao).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#criar');
  });

  it('given a period in the url when loading the faction list then uses it and keeps it in the url', async () => {
    window.history.replaceState(null, '', '#faccoes?periodo=3m');
    render(<App />);

    await screen.findByRole('button', { name: 'Aliança da Floresta' });
    expect(apiService.default.listarFaccoes).toHaveBeenCalledWith('3m');
    expect(window.location.hash).toBe('#faccoes?periodo=3m');
  });

  it('given a period and a faction in the url when loading then opens the detail for that period', async () => {
    window.history.replaceState(null, '', '#faccao/Alian%C3%A7a%20da%20Floresta?periodo=2026-01-01_2026-03-31');
    render(<App />);

    expect(await screen.findByText(/Desempenho por jogador/i)).toBeInTheDocument();
    expect(apiService.default.obterFaccao).toHaveBeenCalledWith('Aliança da Floresta', '2026-01-01_2026-03-31');
    expect(window.location.hash).toBe('#faccao/Alian%C3%A7a%20da%20Floresta?periodo=2026-01-01_2026-03-31');
  });

  it('given a period chosen on the players dashboard when going to the factions tab then keeps the same period', async () => {
    window.history.replaceState(null, '', '#jogadores');
    render(<App />);

    await userEvent.selectOptions(await screen.findByLabelText('Período:'), 'Este ano');
    expect(window.location.hash).toBe('#jogadores?periodo=ano');

    await userEvent.click(screen.getByRole('button', { name: '🛡️ Facções' }));

    await screen.findByRole('button', { name: 'Aliança da Floresta' });
    expect(apiService.default.listarFaccoes).toHaveBeenLastCalledWith('ano');
    expect(window.location.hash).toBe('#faccoes?periodo=ano');
    expect(screen.getByLabelText('Período:')).toHaveDisplayValue('Este ano');
  });

  it('given an invalid period in the url when loading then falls back to the whole history', async () => {
    window.history.replaceState(null, '', '#faccoes?periodo=2026-05-01_2026-01-01');
    render(<App />);

    await screen.findByRole('button', { name: 'Aliança da Floresta' });
    expect(apiService.default.listarFaccoes).toHaveBeenCalledWith('tudo');
    expect(window.location.hash).toBe('#faccoes');
  });

  it('given a period when leaving the dashboards then drops it from the url', async () => {
    window.history.replaceState(null, '', '#jogadores?periodo=12m');
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /Criar Mesa/i }));

    expect(window.location.hash).toBe('#criar');
  });
});

describe('App dashboards tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiService.default.obterRanking.mockResolvedValue([]);
    apiService.default.obterRankingJogador.mockResolvedValue({ factions: [] });
    apiService.default.listarFaccoes.mockResolvedValue([DETALHE]);
    apiService.default.obterFaccao.mockResolvedValue(DETALHE);
    apiService.default.listarPeriodosSalvos.mockResolvedValue([]);
  });

  const abaAtiva = () => screen.getAllByRole('button').filter(b => b.classList.contains('active')).map(b => b.textContent);

  it('given the navbar when rendering then has separate Jogadores and Facções tabs and no generic Dashboard', () => {
    window.history.replaceState(null, '', '#criar');
    render(<App />);

    expect(screen.getByRole('button', { name: '👤 Jogadores' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '🛡️ Facções' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /📊 Dashboard/ })).not.toBeInTheDocument();
  });

  it('given the Jogadores tab when clicking it then shows only the players dashboard and marks the tab', async () => {
    window.history.replaceState(null, '', '#criar');
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: '👤 Jogadores' }));

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('👤 Dashboard de Jogadores');
    expect(window.location.hash).toBe('#jogadores');
    expect(abaAtiva()).toEqual(['👤 Jogadores']);
    expect(apiService.default.listarFaccoes).not.toHaveBeenCalled();
  });

  it('given the Facções tab when clicking it then shows only the factions dashboard and marks the tab', async () => {
    window.history.replaceState(null, '', '#criar');
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: '🛡️ Facções' }));

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('🛡️ Dashboard de Facções');
    expect(abaAtiva()).toEqual(['🛡️ Facções']);
    expect(apiService.default.obterRanking).not.toHaveBeenCalled();
  });

  it('given a faction detail when rendering then marks the Facções tab', async () => {
    window.history.replaceState(null, '', '#faccao/Alian%C3%A7a%20da%20Floresta');
    render(<App />);

    await screen.findByText(/Desempenho por jogador/i);
    expect(abaAtiva()).toEqual(['🛡️ Facções']);
  });

  it.each([
    ['#dashboard', '#jogadores'],
    ['#dashboard?periodo=3m', '#jogadores?periodo=3m']
  ])('given the old route %s when loading then redirects to %s', async (antiga, nova) => {
    window.history.replaceState(null, '', antiga);
    render(<App />);

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('👤 Dashboard de Jogadores');
    expect(window.location.hash).toBe(nova);
  });
});

describe('App ranking tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiService.default.obterRanking.mockResolvedValue([
      { playerId: 1, playerName: 'Ana', totalScore: 75, totalGames: 3, totalVictories: 2, differentFactions: 2 }
    ]);
    apiService.default.obterRankingJogador.mockResolvedValue({ factions: [] });
    apiService.default.listarFaccoes.mockResolvedValue([DETALHE]);
    apiService.default.obterFaccao.mockResolvedValue(DETALHE);
    apiService.default.listarPeriodosSalvos.mockResolvedValue([]);
  });

  it('given the Ranking button when clicking it then opens the players ranking by default', async () => {
    window.history.replaceState(null, '', '#criar');
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /🏆 Ranking/ }));

    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(window.location.hash).toBe('#ranking');
    expect(apiService.default.listarFaccoes).not.toHaveBeenCalled();
  });

  it('given the ranking when switching to factions then keeps the choice in the url', async () => {
    window.history.replaceState(null, '', '#ranking');
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Facções', pressed: false }));

    expect(await screen.findByRole('button', { name: 'Aliança da Floresta' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#ranking?tipo=faccoes');

    await userEvent.click(screen.getByRole('button', { name: 'Jogadores', pressed: false }));
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(window.location.hash).toBe('#ranking');
  });

  it('given the ranking selector when rendering then its buttons are not confused with the navbar tabs', async () => {
    window.history.replaceState(null, '', '#ranking');
    render(<App />);

    const grupo = await screen.findByRole('group', { name: 'Tipo de ranking' });
    expect(screen.getAllByRole('button', { name: 'Facções' })).toEqual([within(grupo).getByRole('button', { name: 'Facções' })]);
    expect(screen.getAllByRole('button', { name: '🛡️ Facções' })).toHaveLength(1); // só a aba da navbar
  });

  it('given the factions ranking in the url when loading then opens it', async () => {
    window.history.replaceState(null, '', '#ranking?tipo=faccoes');
    render(<App />);

    expect(await screen.findByRole('button', { name: 'Aliança da Floresta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Facções', pressed: true })).toBeInTheDocument();
    // A aba da navbar continua sendo o Ranking
    expect(screen.getByRole('button', { name: /🏆 Ranking/ })).toHaveClass('active');
  });

  it.each(['#ranking?tipo=lixo', '#ranking?tipo='])('given an invalid type %s in the url when loading then opens the players ranking', async (hash) => {
    window.history.replaceState(null, '', hash);
    render(<App />);

    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(window.location.hash).toBe('#ranking');
  });

  it('given the factions ranking when clicking a faction then opens its detail', async () => {
    window.history.replaceState(null, '', '#ranking?tipo=faccoes');
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Aliança da Floresta' }));

    expect(await screen.findByText(/Desempenho por jogador/i)).toBeInTheDocument();
    expect(window.location.hash).toBe('#faccao/Alian%C3%A7a%20da%20Floresta');
  });

  it('given the factions ranking when leaving the tab then drops the type from the url', async () => {
    window.history.replaceState(null, '', '#ranking?tipo=faccoes');
    render(<App />);
    await screen.findByRole('button', { name: 'Aliança da Floresta' });

    await userEvent.click(screen.getByRole('button', { name: /Criar Mesa/i }));

    expect(window.location.hash).toBe('#criar');
  });
});

describe('App ranking period and player links', () => {
  const JOGADORES = [
    { playerId: 1, playerName: 'Ana', totalScore: 75, totalGames: 3, totalVictories: 2, differentFactions: 2 },
    { playerId: 2, playerName: 'Bruno', totalScore: 52, totalGames: 2, totalVictories: 1, differentFactions: 2 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    apiService.default.obterRanking.mockResolvedValue(JOGADORES);
    apiService.default.obterRankingJogador.mockResolvedValue({ factions: [] });
    apiService.default.listarFaccoes.mockResolvedValue([DETALHE]);
    apiService.default.obterFaccao.mockResolvedValue(DETALHE);
    apiService.default.listarPeriodosSalvos.mockResolvedValue([]);
  });

  it('given type and period in the url when loading the ranking then uses both and keeps them', async () => {
    window.history.replaceState(null, '', '#ranking?tipo=faccoes&periodo=3m');
    render(<App />);

    await screen.findByRole('button', { name: 'Aliança da Floresta' });
    expect(apiService.default.listarFaccoes).toHaveBeenCalledWith('3m');
    expect(screen.getByLabelText('Período:')).toHaveDisplayValue('Últimos 3 meses');
    expect(window.location.hash).toBe('#ranking?tipo=faccoes&periodo=3m');
  });

  it('given a period chosen in the ranking when opening the dashboards then they use the same period', async () => {
    window.history.replaceState(null, '', '#ranking');
    render(<App />);

    await userEvent.selectOptions(await screen.findByLabelText('Período:'), 'Este ano');
    expect(window.location.hash).toBe('#ranking?periodo=ano');

    await userEvent.click(screen.getByRole('button', { name: '🛡️ Facções' }));
    await screen.findByRole('button', { name: 'Aliança da Floresta' });
    expect(apiService.default.listarFaccoes).toHaveBeenLastCalledWith('ano');
    expect(screen.getByLabelText('Período:')).toHaveDisplayValue('Este ano');
  });

  it('given a period chosen on the players dashboard when opening the ranking then it uses the same period', async () => {
    window.history.replaceState(null, '', '#jogadores');
    render(<App />);

    await userEvent.selectOptions(await screen.findByLabelText('Período:'), 'Últimos 3 meses');
    await userEvent.click(screen.getByRole('button', { name: /🏆 Ranking/ }));

    await screen.findByRole('button', { name: 'Bruno' });
    expect(apiService.default.obterRanking).toHaveBeenLastCalledWith('3m');
    expect(window.location.hash).toBe('#ranking?periodo=3m');
  });

  it('given the players ranking when clicking a player then opens the players dashboard with them and the period', async () => {
    window.history.replaceState(null, '', '#ranking?periodo=3m');
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Bruno' }));

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('👤 Dashboard de Jogadores');
    expect(await screen.findByLabelText('Jogador:')).toHaveDisplayValue('Bruno');
    await waitFor(() => expect(window.location.hash).toBe('#jogadores?jogador=2&periodo=3m'));
    expect(apiService.default.obterRankingJogador).toHaveBeenCalledWith('2', '3m');
    expect(screen.getByRole('button', { name: '👤 Jogadores' })).toHaveClass('active');
  });

  it('given a player in the url when loading the players dashboard then selects them', async () => {
    window.history.replaceState(null, '', '#jogadores?jogador=2');
    render(<App />);

    expect(await screen.findByLabelText('Jogador:')).toHaveDisplayValue('Bruno');
    expect(window.location.hash).toBe('#jogadores?jogador=2');
  });

  it('given a player chosen on the players dashboard when changing it then keeps it in the url', async () => {
    window.history.replaceState(null, '', '#jogadores');
    render(<App />);

    await waitFor(() => expect(window.location.hash).toBe('#jogadores?jogador=1'));
    fireEvent.change(await screen.findByLabelText('Jogador:'), { target: { value: '2' } });

    await waitFor(() => expect(window.location.hash).toBe('#jogadores?jogador=2'));
  });

  it.each(['abc', '999', '-1', ''])('given the invalid player "%s" in the url when loading then falls back to the first player', async (id) => {
    window.history.replaceState(null, '', `#jogadores?jogador=${id}&periodo=12m`);
    render(<App />);

    expect(await screen.findByLabelText('Jogador:')).toHaveDisplayValue('Ana');
    await waitFor(() => expect(window.location.hash).toBe('#jogadores?jogador=1&periodo=12m'));
  });

  it('given the factions ranking with a period when clicking a faction then opens its detail with the period', async () => {
    window.history.replaceState(null, '', '#ranking?tipo=faccoes&periodo=3m');
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Aliança da Floresta' }));

    expect(await screen.findByText(/Desempenho por jogador/i)).toBeInTheDocument();
    expect(apiService.default.obterFaccao).toHaveBeenCalledWith('Aliança da Floresta', '3m');
    expect(window.location.hash).toBe('#faccao/Alian%C3%A7a%20da%20Floresta?periodo=3m');
  });

  it('given a selected player when leaving the players dashboard then drops the player from the url', async () => {
    window.history.replaceState(null, '', '#jogadores?jogador=2');
    render(<App />);
    await screen.findByLabelText('Jogador:');

    await userEvent.click(screen.getByRole('button', { name: /🏆 Ranking/ }));

    await screen.findByRole('button', { name: 'Bruno' });
    expect(window.location.hash).toBe('#ranking');
  });
});

describe('App temporadas', () => {
  const SALVOS = [
    { id: 2, name: 'Temporada 2', from: new Date(2026, 3, 1).toISOString(), to: null },
    { id: 1, name: 'Temporada 1', from: new Date(2025, 10, 1).toISOString(), to: new Date(2026, 3, 1).toISOString() }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Os períodos salvos ficam registrados em utils/periodo.js: cada teste começa do zero
    definirPeriodosSalvos([]);
    apiService.default.obterRanking.mockResolvedValue([
      { playerId: 1, playerName: 'Ana', totalScore: 75, totalGames: 3, totalVictories: 2, differentFactions: 2 }
    ]);
    apiService.default.obterRankingJogador.mockResolvedValue({ factions: [] });
    apiService.default.listarFaccoes.mockResolvedValue([DETALHE]);
    apiService.default.obterFaccao.mockResolvedValue(DETALHE);
    apiService.default.listarPeriodosSalvos.mockResolvedValue(SALVOS);
  });

  it('given the navbar when clicking Nova Temporada then opens the seasons screen', async () => {
    window.history.replaceState(null, '', '#criar');
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: '🗓️ Nova Temporada' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('🗓️ Temporadas');
    expect(window.location.hash).toBe('#temporadas');
    expect(await screen.findByText('Temporada 1', { selector: 'strong' })).toBeInTheDocument();
  });

  it('given a season in the url when loading the ranking then waits for the seasons and uses it', async () => {
    let responder;
    apiService.default.listarPeriodosSalvos.mockImplementationOnce(() => new Promise(r => { responder = r; }));
    window.history.replaceState(null, '', '#ranking?periodo=salvo:1');
    render(<App />);

    expect(screen.getByText(/Carregando períodos salvos/)).toBeInTheDocument();
    expect(apiService.default.obterRanking).not.toHaveBeenCalled();

    await act(async () => responder(SALVOS));

    await screen.findByRole('button', { name: 'Ana' });
    expect(apiService.default.obterRanking).toHaveBeenCalledWith('salvo:1');
    expect(screen.getByLabelText('Temporada:')).toHaveDisplayValue('Temporada 1');
    expect(screen.getByLabelText('Período:')).toHaveDisplayValue('—');
    expect(window.location.hash).toBe('#ranking?periodo=salvo:1');
  });

  it.each(['salvo:99', 'salvo:abc'])('given the unknown season "%s" in the url when loading then falls back to Tudo', async (periodo) => {
    window.history.replaceState(null, '', `#faccoes?periodo=${periodo}`);
    render(<App />);

    await screen.findByRole('button', { name: 'Aliança da Floresta' });
    expect(apiService.default.listarFaccoes).toHaveBeenCalledWith('tudo');
    expect(apiService.default.listarFaccoes).not.toHaveBeenCalledWith(periodo);
    expect(window.location.hash).toBe('#faccoes');
  });

  it('given the seasons fail to load when a season is in the url then falls back to Tudo and says why', async () => {
    apiService.default.listarPeriodosSalvos.mockRejectedValueOnce(new Error('Erro 500 ao listar períodos salvos'));
    window.history.replaceState(null, '', '#faccoes?periodo=salvo:1');
    render(<App />);

    await screen.findByRole('button', { name: 'Aliança da Floresta' });
    expect(apiService.default.listarFaccoes).toHaveBeenCalledWith('tudo');
    expect(screen.getByText(/Não foi possível carregar os períodos salvos: Erro 500/)).toBeInTheDocument();
  });

  it('given an old backend without /api/periods (404) when opening a dashboard then shows the error and the shortcuts keep working', async () => {
    apiService.default.listarPeriodosSalvos.mockRejectedValueOnce(
      Object.assign(new Error('Erro 404 ao listar períodos salvos'), { status: 404 })
    );
    window.history.replaceState(null, '', '#faccoes');
    render(<App />);

    expect(await screen.findByText(/Não foi possível carregar os períodos salvos: Erro 404/)).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Temporadas' })).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Período:'), 'Últimos 3 meses');

    await waitFor(() => expect(apiService.default.listarFaccoes).toHaveBeenLastCalledWith('3m'));
    expect(window.location.hash).toBe('#faccoes?periodo=3m');
  });

  it('given a new season when clicking to see the ranking then opens the ranking filtered by it', async () => {
    const NOVA = { id: 3, name: 'Temporada 3', from: new Date(2026, 9, 1).toISOString(), to: null };
    apiService.default.criarPeriodoSalvo.mockResolvedValueOnce(NOVA);
    apiService.default.atualizarPeriodoSalvo.mockResolvedValueOnce({ ...SALVOS[0], to: NOVA.from });
    window.history.replaceState(null, '', '#temporadas');
    render(<App />);
    await screen.findByText('Temporada 1', { selector: 'strong' });

    apiService.default.listarPeriodosSalvos.mockResolvedValue([NOVA, { ...SALVOS[0], to: NOVA.from }, SALVOS[1]]);
    const form = screen.getByRole('region', { name: 'Nova temporada' });
    await userEvent.type(within(form).getByLabelText('Nome'), 'Temporada 3');
    fireEvent.change(within(form).getByLabelText('Início'), { target: { value: '2026-10-01' } });
    await userEvent.click(within(form).getByRole('button', { name: 'Criar temporada' }));

    await userEvent.click(await screen.findByRole('button', { name: /Ver o Ranking nesta temporada/ }));

    await screen.findByRole('button', { name: 'Ana' });
    expect(window.location.hash).toBe('#ranking?periodo=salvo:3');
    expect(apiService.default.obterRanking).toHaveBeenLastCalledWith('salvo:3');
    expect(screen.getByLabelText('Temporada:')).toHaveDisplayValue('Temporada 3');
    expect(apiService.default.atualizarPeriodoSalvo).toHaveBeenCalledWith(2, { name: 'Temporada 2', from: SALVOS[0].from, to: NOVA.from });
  });

  it('given the ranking when choosing a season and then a period then each choice replaces the other in the url', async () => {
    window.history.replaceState(null, '', '#ranking?periodo=3m');
    render(<App />);
    await screen.findByRole('button', { name: 'Ana' });

    await userEvent.selectOptions(await screen.findByLabelText('Temporada:'), 'Temporada 2');
    await waitFor(() => expect(window.location.hash).toBe('#ranking?periodo=salvo:2'));
    await waitFor(() => expect(apiService.default.obterRanking).toHaveBeenLastCalledWith('salvo:2'));
    expect(screen.getByLabelText('Período:')).toHaveDisplayValue('—');

    await userEvent.selectOptions(screen.getByLabelText('Período:'), 'Este ano');
    await waitFor(() => expect(window.location.hash).toBe('#ranking?periodo=ano'));
    expect(screen.getByLabelText('Temporada:')).toHaveDisplayValue('—');
  });

  it('given the selected season is deleted when back on a dashboard then falls back to Tudo', async () => {
    window.history.replaceState(null, '', '#temporadas?periodo=salvo:1');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App />);
    await screen.findByText('Temporada 1', { selector: 'strong' });

    // Primeiro escolhe a temporada no Ranking, depois a exclui
    await userEvent.click(screen.getByRole('button', { name: 'Ranking de Temporada 1' }));
    await screen.findByRole('button', { name: 'Ana' });
    expect(window.location.hash).toBe('#ranking?periodo=salvo:1');

    await userEvent.click(screen.getByRole('button', { name: '🗓️ Nova Temporada' }));
    apiService.default.listarPeriodosSalvos.mockResolvedValue([SALVOS[0]]);
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Temporada 1' }));
    await waitFor(() => expect(screen.queryByText('Temporada 1', { selector: 'strong' })).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /🏆 Ranking/ }));
    await screen.findByRole('button', { name: 'Ana' });
    expect(apiService.default.obterRanking).toHaveBeenLastCalledWith('tudo');
    expect(window.location.hash).toBe('#ranking');
    vi.restoreAllMocks();
  });

  it('given the selected season has its dates edited when back on the ranking then fetches again', async () => {
    window.history.replaceState(null, '', '#ranking?periodo=salvo:1');
    render(<App />);
    await screen.findByRole('button', { name: 'Ana' });
    const chamadasAntes = apiService.default.obterRanking.mock.calls.length;

    await userEvent.click(screen.getByRole('button', { name: '🗓️ Nova Temporada' }));
    expect(window.location.hash).toBe('#temporadas');

    apiService.default.atualizarPeriodoSalvo.mockResolvedValueOnce({ ...SALVOS[1], to: new Date(2026, 4, 1).toISOString() });
    apiService.default.listarPeriodosSalvos.mockResolvedValue([SALVOS[0], { ...SALVOS[1], to: new Date(2026, 4, 1).toISOString() }]);
    await userEvent.click(await screen.findByRole('button', { name: 'Editar Temporada 1' }));
    const form = screen.getByRole('form', { name: 'Editar Temporada 1' });
    fireEvent.change(within(form).getByLabelText('Fim (opcional)'), { target: { value: '2026-04-30' } });
    await userEvent.click(within(form).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(screen.queryByRole('form', { name: 'Editar Temporada 1' })).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /🏆 Ranking/ }));
    await screen.findByRole('button', { name: 'Ana' });
    expect(apiService.default.obterRanking.mock.calls.length).toBeGreaterThan(chamadasAntes);
    expect(screen.getByText('Temporada 1: 01/11/2025 – 30/04/2026')).toBeInTheDocument();
  });
});
