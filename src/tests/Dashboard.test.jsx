import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../pages/Dashboard.jsx';
import * as apiService from '../services/api.js';

// Mock do serviço de API
vi.mock('../services/api.js', () => ({
  default: {
    obterRanking: vi.fn()
  }
}));

describe('Dashboard component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('given an empty ranking when rendering then shows the title', async () => {
    apiService.default.obterRanking.mockResolvedValueOnce([]);
    render(<Dashboard />);

    expect(await screen.findByText(/📊 Dashboard/i)).toBeInTheDocument();
  });

  it('given a pending request when rendering then shows the loading message', () => {
    apiService.default.obterRanking.mockImplementationOnce(
      () => new Promise(() => {}) // Nunca resolve
    );

    render(<Dashboard />);
    expect(screen.getByText(/⏳ Carregando dashboard/i)).toBeInTheDocument();
  });

  it('given a ranking when rendering then shows the first player statistics by default', async () => {
    const mockJogadores = [
      { playerId: 1, playerName: 'João', totalGames: 10, differentFactions: 4, totalVictories: 6, winPercentage: 60, totalScore: 120 },
      { playerId: 2, playerName: 'Maria', totalGames: 8, differentFactions: 3, totalVictories: 5, winPercentage: 62.5, totalScore: 100 }
    ];

    apiService.default.obterRanking.mockResolvedValueOnce(mockJogadores);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // partidas jogadas
      expect(screen.getByText('4')).toBeInTheDocument();  // facções diferentes
      expect(screen.getByText('6')).toBeInTheDocument();  // vitórias
    });

    expect(screen.getByText(/Partidas Jogadas/i)).toBeInTheDocument();
    expect(screen.getByText(/Facções Diferentes/i)).toBeInTheDocument();
    expect(screen.getByText('Vitórias')).toBeInTheDocument();
  });

  it('given a ranking when choosing another player then shows that player statistics', async () => {
    const mockJogadores = [
      { playerId: 1, playerName: 'João', totalGames: 10, differentFactions: 4, totalVictories: 6, winPercentage: 60, totalScore: 120 },
      { playerId: 2, playerName: 'Maria', totalGames: 8, differentFactions: 3, totalVictories: 5, winPercentage: 62.5, totalScore: 100 }
    ];

    apiService.default.obterRanking.mockResolvedValueOnce(mockJogadores);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Jogador/i)).toBeInTheDocument();
    });

    const seletor = screen.getByLabelText(/Jogador/i);
    fireEvent.change(seletor, { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('given no players when rendering then shows the empty message', async () => {
    apiService.default.obterRanking.mockResolvedValueOnce([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhum jogador encontrado/i)).toBeInTheDocument();
    });
  });

  it('given a failed request when rendering then shows the error message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    apiService.default.obterRanking.mockRejectedValueOnce(
      new Error('Erro ao carregar jogadores')
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/⚠️ Erro ao carregar jogadores/i)).toBeInTheDocument();
    });
  });
});
