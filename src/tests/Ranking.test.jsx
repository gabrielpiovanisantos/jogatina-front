import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Ranking from '../pages/Ranking.jsx';
import * as apiService from '../services/api.js';

// Mock do serviço de API
vi.mock('../services/api.js', () => ({
  default: {
    obterRanking: vi.fn(),
    listarFaccoes: vi.fn()
  }
}));

// Mesmo formato de GET /dashboard/factions, na ordem do backend
const FACCOES = [
  { faction: 'Marqueses', totalGames: 18, totalVictories: 6, winPercentage: 33.33333333333333, totalScore: 432, averageScore: 24.0, distinctPlayers: 6 },
  { faction: 'Aliança da Floresta', totalGames: 12, totalVictories: 4, winPercentage: 33.33333333333333, totalScore: 276, averageScore: 23.0, distinctPlayers: 5 },
  { faction: 'Malandro', totalGames: 14, totalVictories: 4, winPercentage: 28.571428571428573, totalScore: 294, averageScore: 21.0, distinctPlayers: 5 },
  { faction: 'Lagartos Cultistas', totalGames: 6, totalVictories: 1, winPercentage: 16.666666666666664, totalScore: 117, averageScore: 19.5, distinctPlayers: 3 }
];

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

  describe('ranking type selector', () => {
    it('given the ranking tab when rendering then offers Jogadores and Facções with Jogadores selected by default', async () => {
      apiService.default.obterRanking.mockResolvedValueOnce([]);

      render(<Ranking onMudarTipo={vi.fn()} onSelecionarFaccao={vi.fn()} />);

      const grupo = await screen.findByRole('group', { name: 'Tipo de ranking' });
      expect(within(grupo).getByRole('button', { name: 'Jogadores' })).toHaveAttribute('aria-pressed', 'true');
      expect(within(grupo).getByRole('button', { name: 'Facções' })).toHaveAttribute('aria-pressed', 'false');
      expect(apiService.default.obterRanking).toHaveBeenCalledTimes(1);
      expect(apiService.default.listarFaccoes).not.toHaveBeenCalled();
    });

    it('given the selector when clicking Facções then reports the new type', async () => {
      apiService.default.obterRanking.mockResolvedValueOnce([]);
      const onMudarTipo = vi.fn();

      render(<Ranking onMudarTipo={onMudarTipo} onSelecionarFaccao={vi.fn()} />);
      await userEvent.click(screen.getByRole('button', { name: 'Facções' }));

      expect(onMudarTipo).toHaveBeenCalledWith('faccoes');
    });

    it('given the factions type when rendering then lists the factions in the backend order with one decimal place', async () => {
      apiService.default.listarFaccoes.mockResolvedValueOnce(FACCOES);

      render(<Ranking tipo="faccoes" onMudarTipo={vi.fn()} onSelecionarFaccao={vi.fn()} />);

      const linhas = (await screen.findAllByRole('row')).slice(1);
      expect(linhas.map(l => within(l).getAllByRole('cell')[1].textContent)).toEqual(
        ['Marqueses', 'Aliança da Floresta', 'Malandro', 'Lagartos Cultistas']
      );
      const marqueses = within(linhas[0]).getAllByRole('cell').map(c => c.textContent);
      expect(marqueses).toEqual(['🥇', 'Marqueses', '18', '6', '33,3%', '24,0', '6']);
      expect(within(linhas[3]).getAllByRole('cell')[0]).toHaveTextContent('#4');
      expect(screen.getAllByRole('columnheader').map(h => h.textContent)).toEqual(
        ['Posição', 'Facção', 'Partidas', 'Vitórias', '% Vitórias', 'Média de pontos', 'Jogadores']
      );
      // Sem período no Ranking: pede todo o histórico, e só o ranking de facções
      expect(apiService.default.listarFaccoes).toHaveBeenCalledWith();
      expect(apiService.default.obterRanking).not.toHaveBeenCalled();
      expect(screen.queryByLabelText('Período:')).not.toBeInTheDocument();
    });

    it('given the factions ranking when clicking a faction then opens it by name', async () => {
      apiService.default.listarFaccoes.mockResolvedValueOnce(FACCOES);
      const onSelecionarFaccao = vi.fn();

      render(<Ranking tipo="faccoes" onMudarTipo={vi.fn()} onSelecionarFaccao={onSelecionarFaccao} />);
      await userEvent.click(await screen.findByRole('button', { name: 'Aliança da Floresta' }));

      expect(onSelecionarFaccao).toHaveBeenCalledWith('Aliança da Floresta');
    });

    it('given no factions when rendering the factions ranking then shows the empty message', async () => {
      apiService.default.listarFaccoes.mockResolvedValueOnce([]);

      render(<Ranking tipo="faccoes" onMudarTipo={vi.fn()} onSelecionarFaccao={vi.fn()} />);

      expect(await screen.findByText(/Nenhuma facção no ranking ainda/i)).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('given a failed request when loading the factions ranking then shows the error only', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      apiService.default.listarFaccoes.mockRejectedValueOnce(new Error('Erro 500 ao listar facções'));

      render(<Ranking tipo="faccoes" onMudarTipo={vi.fn()} onSelecionarFaccao={vi.fn()} />);

      expect(await screen.findByText(/⚠️ Erro ao carregar ranking de facções: Erro 500/)).toBeInTheDocument();
      expect(screen.queryByText(/Nenhuma facção no ranking ainda/i)).not.toBeInTheDocument();
    });

    it('given the factions ranking when switching back to players then shows the players table again', async () => {
      apiService.default.listarFaccoes.mockResolvedValueOnce(FACCOES);
      apiService.default.obterRanking.mockResolvedValueOnce([
        { playerId: 1, playerName: 'Ana', totalScore: 75, totalGames: 3, totalVictories: 2 }
      ]);

      const { rerender } = render(<Ranking tipo="faccoes" onMudarTipo={vi.fn()} onSelecionarFaccao={vi.fn()} />);
      await screen.findByText('Marqueses');

      rerender(<Ranking tipo="jogadores" onMudarTipo={vi.fn()} onSelecionarFaccao={vi.fn()} />);

      expect(await screen.findByText('Ana')).toBeInTheDocument();
      expect(screen.queryByText('Marqueses')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Jogadores' })).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
