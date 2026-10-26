import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../pages/Dashboard.jsx';
import * as apiService from '../services/api.js';

// Mock do serviço de API
vi.mock('../services/api.js', () => ({
  default: {
    obterRanking: vi.fn(),
    obterRankingJogador: vi.fn()
  }
}));

const JOGADORES = [
  { playerId: 1, playerName: 'Ana', totalGames: 3, differentFactions: 2, totalVictories: 2, totalScore: 75 },
  { playerId: 2, playerName: 'Bruno', totalGames: 1, differentFactions: 1, totalVictories: 0, totalScore: 18 }
];

// Mesmo exemplo do contrato de GET /dashboard/ranking/{playerId}
const FACCOES_ANA = [
  { faction: 'Marqueses', totalGames: 2, totalVictories: 2, winPercentage: 100.0, totalScore: 55, averageScore: 27.5 },
  { faction: 'Malandro', totalGames: 1, totalVictories: 0, winPercentage: 0.0, totalScore: 20, averageScore: 20.0 }
];

const FACCOES_BRUNO = [
  { faction: 'Companhia Ribeirinha', totalGames: 1, totalVictories: 0, winPercentage: 0.0, totalScore: 18, averageScore: 18.0 }
];

const detalheDe = (id) => ({
  ...JOGADORES.find(j => String(j.playerId) === String(id)),
  factions: String(id) === '1' ? FACCOES_ANA : FACCOES_BRUNO
});

describe('Dashboard component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiService.default.obterRankingJogador.mockImplementation(async (id) => detalheDe(id));
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
    expect(screen.getByText('Vitórias', { selector: '.card-rotulo' })).toBeInTheDocument();
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

  it('given a faction navigation handler when clicking the factions button then calls it', async () => {
    apiService.default.obterRanking.mockResolvedValueOnce([]);
    const onVerFaccoes = vi.fn();

    render(<Dashboard onVerFaccoes={onVerFaccoes} />);
    await userEvent.click(screen.getByRole('button', { name: /desempenho das facções/i }));

    expect(onVerFaccoes).toHaveBeenCalledTimes(1);
  });

  describe('player factions', () => {
    it('given a player when rendering then requests the player ranking and lists the factions in the backend order', async () => {
      apiService.default.obterRanking.mockResolvedValueOnce(JOGADORES);

      render(<Dashboard />);

      const tabela = await screen.findByRole('table');
      expect(apiService.default.obterRankingJogador).toHaveBeenCalledWith('1');
      const linhas = within(tabela).getAllByRole('row').slice(1);
      expect(linhas.map(l => within(l).getAllByRole('cell')[0].textContent)).toEqual(['🏆 Marqueses', 'Malandro']);
      expect(within(linhas[0]).getByText('100,0%')).toBeInTheDocument();
      expect(within(linhas[0]).getByText('27,5')).toBeInTheDocument();
    });

    it('given factions with and without victories when rendering then highlights only the winning ones', async () => {
      apiService.default.obterRanking.mockResolvedValueOnce(JOGADORES);

      render(<Dashboard />);

      expect(await screen.findByText('🏆 Venceu com: Marqueses')).toBeInTheDocument();
      const [marqueses, malandro] = within(screen.getByRole('table')).getAllByRole('row').slice(1);
      expect(marqueses).toHaveClass('faccao-vencedora');
      expect(within(marqueses).getByLabelText('venceu')).toBeInTheDocument();
      expect(malandro).not.toHaveClass('faccao-vencedora');
      expect(within(malandro).queryByLabelText('venceu')).not.toBeInTheDocument();
    });

    it('given a player without victories when rendering then says so', async () => {
      apiService.default.obterRanking.mockResolvedValueOnce([JOGADORES[1]]);

      render(<Dashboard />);

      expect(await screen.findByText(/Ainda sem vitórias com nenhuma facção/i)).toBeInTheDocument();
    });

    it('given a player without games when rendering then shows the empty factions message', async () => {
      apiService.default.obterRanking.mockResolvedValueOnce(JOGADORES);
      apiService.default.obterRankingJogador.mockResolvedValueOnce({ ...JOGADORES[0], factions: [] });

      render(<Dashboard />);

      expect(await screen.findByText(/ainda não tem facções registradas/i)).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('given another player is chosen when rendering then shows that player factions', async () => {
      apiService.default.obterRanking.mockResolvedValueOnce(JOGADORES);

      render(<Dashboard />);
      await screen.findByText('🏆 Venceu com: Marqueses');

      fireEvent.change(screen.getByLabelText(/Jogador/i), { target: { value: '2' } });

      expect(await screen.findByRole('cell', { name: 'Companhia Ribeirinha' })).toBeInTheDocument();
      expect(screen.queryByText('Marqueses')).not.toBeInTheDocument();
      expect(apiService.default.obterRankingJogador).toHaveBeenLastCalledWith('2');
    });

    it('given a slow answer for the previous player when switching then keeps the current player factions', async () => {
      apiService.default.obterRanking.mockResolvedValueOnce(JOGADORES);
      let responderAna;
      apiService.default.obterRankingJogador
        .mockImplementationOnce(() => new Promise(resolve => { responderAna = resolve; }))
        .mockImplementationOnce(async () => detalheDe(2));

      render(<Dashboard />);
      await waitFor(() => expect(apiService.default.obterRankingJogador).toHaveBeenCalledTimes(1));

      fireEvent.change(screen.getByLabelText(/Jogador/i), { target: { value: '2' } });
      await screen.findByRole('cell', { name: 'Companhia Ribeirinha' });

      await act(async () => responderAna(detalheDe(1)));

      expect(screen.getByRole('cell', { name: 'Companhia Ribeirinha' })).toBeInTheDocument();
      expect(screen.queryByText('Marqueses')).not.toBeInTheDocument();
    });

    it('given an unknown player when the backend responds 404 then shows the error only in the factions section', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      apiService.default.obterRanking.mockResolvedValueOnce(JOGADORES);
      apiService.default.obterRankingJogador.mockRejectedValueOnce(new Error('Erro 404 ao obter ranking do jogador'));

      render(<Dashboard />);

      expect(await screen.findByText(/⚠️ Erro ao carregar facções do jogador: Erro 404/i)).toBeInTheDocument();
      expect(screen.getByText('Partidas Jogadas')).toBeInTheDocument();
    });

    it('given a faction navigation handler when clicking a player faction then opens it by name', async () => {
      apiService.default.obterRanking.mockResolvedValueOnce(JOGADORES);
      const onSelecionarFaccao = vi.fn();

      render(<Dashboard onSelecionarFaccao={onSelecionarFaccao} />);
      await userEvent.click(await screen.findByRole('button', { name: 'Malandro' }));

      expect(onSelecionarFaccao).toHaveBeenCalledWith('Malandro');
    });
  });
});
