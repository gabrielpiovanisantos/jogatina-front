import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Ranking from '../pages/Ranking.jsx';
import * as apiService from '../services/api.js';

// Mock do serviço de API
vi.mock('../services/api.js', () => ({
  default: {
    obterRanking: vi.fn()
  }
}));

describe('Ranking component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('given an empty ranking when rendering then shows the title', async () => {
    apiService.default.obterRanking.mockResolvedValueOnce([]);
    render(<Ranking />);

    expect(await screen.findByText(/🏆 Ranking/i)).toBeInTheDocument();
  });

  it('given a pending request when rendering then shows the loading message', () => {
    apiService.default.obterRanking.mockImplementationOnce(
      () => new Promise(() => {}) // Nunca resolve
    );

    render(<Ranking />);
    expect(screen.getByText(/⏳ Carregando ranking/i)).toBeInTheDocument();
  });

  it('given a ranking when rendering then shows the players table', async () => {
    const mockRanking = [
      { playerId: 1, playerName: 'João', totalScore: 1500, totalGames: 10, totalVictories: 7 },
      { playerId: 2, playerName: 'Maria', totalScore: 1200, totalGames: 8, totalVictories: 5 },
      { playerId: 3, playerName: 'Pedro', totalScore: 1000, totalGames: 6, totalVictories: 4 }
    ];

    apiService.default.obterRanking.mockResolvedValueOnce(mockRanking);

    render(<Ranking />);

    await waitFor(() => {
      expect(screen.getByText('João')).toBeInTheDocument();
      expect(screen.getByText('Maria')).toBeInTheDocument();
      expect(screen.getByText('Pedro')).toBeInTheDocument();
    });

    // Verificar que os dados aparecem na tabela
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('given a ranking when rendering then shows medals for the top positions', async () => {
    const mockRanking = [
      { playerId: 1, playerName: 'João', totalScore: 1500, totalGames: 10, totalVictories: 7 },
      { playerId: 2, playerName: 'Maria', totalScore: 1200, totalGames: 8, totalVictories: 5 },
      { playerId: 3, playerName: 'Pedro', totalScore: 1000, totalGames: 6, totalVictories: 4 }
    ];

    apiService.default.obterRanking.mockResolvedValueOnce(mockRanking);

    render(<Ranking />);

    await waitFor(() => {
      const posicoes = screen.getAllByText(/🥇|🥈|🥉|#/);
      expect(posicoes.length).toBeGreaterThan(0);
    });
  });

  it('given an empty ranking when rendering then shows the empty message', async () => {
    apiService.default.obterRanking.mockResolvedValueOnce([]);

    render(<Ranking />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhum jogador no ranking ainda/i)).toBeInTheDocument();
    });
  });

  it('given a failed request when rendering then shows the error message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    apiService.default.obterRanking.mockRejectedValueOnce(
      new Error('Erro ao carregar ranking')
    );

    render(<Ranking />);

    await waitFor(() => {
      expect(screen.getByText(/⚠️ Erro ao carregar ranking/i)).toBeInTheDocument();
    });
  });

  it('given the component when mounting then calls obterRanking only once', async () => {
    apiService.default.obterRanking.mockResolvedValueOnce([]);

    render(<Ranking />);

    await waitFor(() => {
      expect(apiService.default.obterRanking).toHaveBeenCalledTimes(1);
    });
  });

  it('given a ranking when rendering then shows points, games and victories', async () => {
    const mockRanking = [
      { playerId: 1, playerName: 'João', totalScore: 1500, totalGames: 10, totalVictories: 7 }
    ];

    apiService.default.obterRanking.mockResolvedValueOnce(mockRanking);

    render(<Ranking />);

    await waitFor(() => {
      expect(screen.getByText('1500')).toBeInTheDocument(); // totalScore
      expect(screen.getByText('10')).toBeInTheDocument();    // totalGames
      expect(screen.getByText('7')).toBeInTheDocument();     // totalVictories
    });
  });

  it('given a ranking when rendering then shows the table headers', async () => {
    apiService.default.obterRanking.mockResolvedValueOnce([]);

    render(<Ranking />);

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /Posição/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Jogador/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Pontos/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Partidas/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Vitórias/i })).toBeInTheDocument();
    });
  });
});

