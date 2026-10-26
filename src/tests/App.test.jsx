import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import * as apiService from '../services/api.js';

vi.mock('../services/api.js', () => ({
  default: {
    obterRanking: vi.fn(),
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
    expect(apiService.default.obterFaccao).toHaveBeenCalledWith('Aliança da Floresta');
    expect(window.location.hash).toBe('#faccao/Alian%C3%A7a%20da%20Floresta');
  });

  it('given a faction in the url when loading then opens its detail', async () => {
    window.history.replaceState(null, '', '#faccao/Alian%C3%A7a%20da%20Floresta');
    render(<App />);

    expect(await screen.findByText(/Desempenho por jogador/i)).toBeInTheDocument();
    expect(apiService.default.obterFaccao).toHaveBeenCalledWith('Aliança da Floresta');
  });

  it('given a malformed faction in the url when loading then falls back to the first screen', () => {
    window.history.replaceState(null, '', '#faccao/%E0');
    render(<App />);

    expect(apiService.default.obterFaccao).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#criar');
  });
});
