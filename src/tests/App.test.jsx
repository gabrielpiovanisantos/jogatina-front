import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import * as apiService from '../services/api.js';

vi.mock('../services/api.js', () => ({
  default: {
    obterRanking: vi.fn(),
    obterRankingJogador: vi.fn(),
    listarFaccoes: vi.fn(),
    obterFaccao: vi.fn()
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
