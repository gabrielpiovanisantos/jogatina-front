import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../pages/Dashboard.jsx';
import * as apiService from '../services/api.js';

// Mock do serviço de API
vi.mock('../services/api.js', () => ({
  default: {
    obterRanking: vi.fn()
  }
}));

describe('Componente Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve renderizar o componente', () => {
    apiService.default.obterRanking.mockResolvedValueOnce([]);
    render(<Dashboard />);

    expect(screen.getByText(/📊 Dashboard/i)).toBeInTheDocument();
  });

  it('deve mostrar mensagem de carregamento inicial', () => {
    apiService.default.obterRanking.mockImplementationOnce(
      () => new Promise(() => {}) // Nunca resolve
    );

    render(<Dashboard />);
    expect(screen.getByText(/⏳ Carregando dashboard/i)).toBeInTheDocument();
  });

  it('deve exibir as estatísticas do primeiro jogador por padrão', async () => {
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

  it('deve permitir trocar o jogador selecionado', async () => {
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
    seletor.value = '2';
    seletor.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('deve exibir mensagem quando não há jogadores', async () => {
    apiService.default.obterRanking.mockResolvedValueOnce([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhum jogador encontrado/i)).toBeInTheDocument();
    });
  });

  it('deve exibir mensagem de erro quando falha a requisição', async () => {
    apiService.default.obterRanking.mockRejectedValueOnce(
      new Error('Erro ao carregar jogadores')
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/⚠️ Erro ao carregar jogadores/i)).toBeInTheDocument();
    });
  });
});
