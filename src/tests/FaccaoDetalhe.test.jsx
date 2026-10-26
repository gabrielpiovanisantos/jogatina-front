import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FaccaoDetalhe from '../pages/FaccaoDetalhe.jsx';
import * as apiService from '../services/api.js';

vi.mock('../services/api.js', () => ({
  default: {
    obterFaccao: vi.fn()
  }
}));

const DETALHE = {
  faction: 'Stark', totalGames: 4, totalVictories: 3, winPercentage: 75.0, totalScore: 120, averageScore: 30.0, distinctPlayers: 2,
  players: [
    { playerId: 1, playerName: 'Alice', totalGames: 3, totalVictories: 3, winPercentage: 100.0, totalScore: 90, averageScore: 30.0 },
    { playerId: 2, playerName: 'Bob', totalGames: 1, totalVictories: 0, winPercentage: 0.0, totalScore: 30, averageScore: 30.0 }
  ]
};

describe('FaccaoDetalhe component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('given a faction when rendering then requests it by name', async () => {
    apiService.default.obterFaccao.mockResolvedValueOnce(DETALHE);

    render(<FaccaoDetalhe faccao="Stark" onVoltar={vi.fn()} />);

    await screen.findByText('Alice');
    expect(apiService.default.obterFaccao).toHaveBeenCalledWith('Stark', 'tudo');
  });

  it('given a pending request when rendering then shows the loading message', () => {
    apiService.default.obterFaccao.mockImplementationOnce(() => new Promise(() => {}));

    render(<FaccaoDetalhe faccao="Stark" onVoltar={vi.fn()} />);

    expect(screen.getByText(/⏳ Carregando facção/i)).toBeInTheDocument();
  });

  it('given the faction detail when rendering then shows the summary cards and the players in the backend order', async () => {
    apiService.default.obterFaccao.mockResolvedValueOnce(DETALHE);

    render(<FaccaoDetalhe faccao="Stark" onVoltar={vi.fn()} />);

    const rotuloPartidas = await screen.findByText('Partidas', { selector: '.card-rotulo' });
    expect(rotuloPartidas.parentElement).toHaveTextContent('4');
    expect(screen.getByText('% Vitórias', { selector: '.card-rotulo' }).parentElement).toHaveTextContent('75,0%');
    expect(screen.getByText('Jogadores', { selector: '.card-rotulo' }).parentElement).toHaveTextContent('2');

    const linhas = screen.getAllByRole('row').slice(1);
    expect(linhas).toHaveLength(2);
    expect(within(linhas[0]).getByText('Alice')).toBeInTheDocument();
    expect(within(linhas[0]).getByText('100,0%')).toBeInTheDocument();
    expect(within(linhas[1]).getByText('Bob')).toBeInTheDocument();
    expect(within(linhas[1]).getByText('0,0%')).toBeInTheDocument();
  });

  it('given a different spelling in the url when the backend answers then shows the backend spelling', async () => {
    apiService.default.obterFaccao.mockResolvedValueOnce(DETALHE);

    render(<FaccaoDetalhe faccao=" stark " onVoltar={vi.fn()} />);

    expect(await screen.findByRole('heading', { level: 1, name: /Stark/ })).toHaveTextContent('🛡️ Stark');
  });

  it('given an unknown faction when the backend responds 404 then shows the error without the tables', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    apiService.default.obterFaccao.mockRejectedValueOnce(new Error('Erro 404 ao obter facção'));

    render(<FaccaoDetalhe faccao="Lannister" onVoltar={vi.fn()} />);

    expect(await screen.findByText(/⚠️ Erro ao carregar a facção Lannister: Erro 404/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('given a faction without players when rendering then shows the empty message', async () => {
    apiService.default.obterFaccao.mockResolvedValueOnce({ ...DETALHE, players: [] });

    render(<FaccaoDetalhe faccao="Stark" onVoltar={vi.fn()} />);

    expect(await screen.findByText(/Nenhum jogador com esta facção/i)).toBeInTheDocument();
  });

  it('given the detail when clicking back then returns to the faction list', async () => {
    apiService.default.obterFaccao.mockResolvedValueOnce(DETALHE);
    const onVoltar = vi.fn();

    render(<FaccaoDetalhe faccao="Stark" onVoltar={onVoltar} />);
    await userEvent.click(screen.getByRole('button', { name: /Voltar às facções/i }));

    expect(onVoltar).toHaveBeenCalledTimes(1);
  });

  it('given a period when rendering then requests the faction for it', async () => {
    apiService.default.obterFaccao.mockResolvedValueOnce(DETALHE);

    render(<FaccaoDetalhe faccao="Stark" onVoltar={vi.fn()} periodo="12m" onMudarPeriodo={vi.fn()} />);

    await screen.findByText('Alice');
    expect(apiService.default.obterFaccao).toHaveBeenCalledWith('Stark', '12m');
  });

  it('given a period when the backend responds 404 then shows the empty period message, not an error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    apiService.default.obterFaccao.mockRejectedValueOnce(
      Object.assign(new Error('Erro 404 ao obter facção'), { status: 404 })
    );

    render(<FaccaoDetalhe faccao="Stark" onVoltar={vi.fn()} periodo="3m" onMudarPeriodo={vi.fn()} />);

    expect(await screen.findByText(/Nenhuma partida de Stark no período \(últimos 3 meses\)/)).toBeInTheDocument();
    expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument();
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('given no period when the backend responds 404 then still shows it as an error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    apiService.default.obterFaccao.mockRejectedValueOnce(
      Object.assign(new Error('Erro 404 ao obter facção'), { status: 404 })
    );

    render(<FaccaoDetalhe faccao="Lannister" onVoltar={vi.fn()} periodo="tudo" onMudarPeriodo={vi.fn()} />);

    expect(await screen.findByText(/⚠️ Erro ao carregar a facção Lannister: Erro 404/)).toBeInTheDocument();
    expect(screen.queryByText(/Nenhuma partida de/)).not.toBeInTheDocument();
  });

  it('given a period with games when the period changes to an empty one then replaces the tables with the empty message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    apiService.default.obterFaccao
      .mockResolvedValueOnce(DETALHE)
      .mockRejectedValueOnce(Object.assign(new Error('Erro 404 ao obter facção'), { status: 404 }));

    const { rerender } = render(<FaccaoDetalhe faccao="Stark" onVoltar={vi.fn()} periodo="tudo" onMudarPeriodo={vi.fn()} />);
    await screen.findByText('Alice');

    rerender(<FaccaoDetalhe faccao="Stark" onVoltar={vi.fn()} periodo="3m" onMudarPeriodo={vi.fn()} />);

    expect(await screen.findByText(/Nenhuma partida de Stark no período/)).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });
});
