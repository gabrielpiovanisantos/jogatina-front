import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('given the dashboard when navigating to a faction then shows its detail and keeps it in the url', async () => {
    window.history.replaceState(null, '', '#dashboard');
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: /desempenho das facções/i }));
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
    window.history.replaceState(null, '', '#dashboard');
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

  it('given a period chosen on the dashboard when going to the factions then keeps the same period', async () => {
    window.history.replaceState(null, '', '#dashboard');
    render(<App />);

    await userEvent.selectOptions(await screen.findByLabelText('Período:'), 'Este ano');
    expect(window.location.hash).toBe('#dashboard?periodo=ano');

    await userEvent.click(screen.getByRole('button', { name: /desempenho das facções/i }));

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
    window.history.replaceState(null, '', '#dashboard?periodo=12m');
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /Criar Mesa/i }));

    expect(window.location.hash).toBe('#criar');
  });
});
