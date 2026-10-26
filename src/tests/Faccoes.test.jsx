import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Faccoes from '../pages/Faccoes.jsx';
import * as apiService from '../services/api.js';

vi.mock('../services/api.js', () => ({
  default: {
    listarFaccoes: vi.fn()
  }
}));

const FACCOES = [
  { faction: 'Stark', totalGames: 4, totalVictories: 3, winPercentage: 75.0, totalScore: 120, averageScore: 30.0, distinctPlayers: 2 },
  { faction: 'Marqueses', totalGames: 6, totalVictories: 2, winPercentage: 33.3, totalScore: 132, averageScore: 22.0, distinctPlayers: 3 }
];

describe('Faccoes component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('given a pending request when rendering then shows the loading message', () => {
    apiService.default.listarFaccoes.mockImplementationOnce(() => new Promise(() => {}));

    render(<Faccoes onSelecionarFaccao={vi.fn()} />);

    expect(screen.getByText(/⏳ Carregando facções/i)).toBeInTheDocument();
  });

  it('given factions when rendering then lists them in the backend order with formatted numbers', async () => {
    apiService.default.listarFaccoes.mockResolvedValueOnce(FACCOES);

    render(<Faccoes onSelecionarFaccao={vi.fn()} />);

    const linhas = (await screen.findAllByRole('row')).slice(1); // sem o cabeçalho
    expect(linhas).toHaveLength(2);

    const primeira = within(linhas[0]);
    expect(primeira.getByText('🥇')).toBeInTheDocument();
    expect(primeira.getByText('Stark')).toBeInTheDocument();
    expect(primeira.getByText('75,0%')).toBeInTheDocument();
    expect(primeira.getByText('30,0')).toBeInTheDocument();

    const segunda = within(linhas[1]);
    expect(segunda.getByText('🥈')).toBeInTheDocument();
    expect(segunda.getByText('Marqueses')).toBeInTheDocument();
    expect(segunda.getByText('33,3%')).toBeInTheDocument();
    expect(segunda.getByText('22,0')).toBeInTheDocument();
  });

  it('given unrounded percentages and averages from the backend when rendering then shows one decimal place', async () => {
    apiService.default.listarFaccoes.mockResolvedValueOnce([
      { faction: 'Stark', totalGames: 3, totalVictories: 2, winPercentage: 66.66666666666666, totalScore: 70, averageScore: 23.333333333333332, distinctPlayers: 2 }
    ]);

    render(<Faccoes onSelecionarFaccao={vi.fn()} />);

    expect(await screen.findByText('66,7%')).toBeInTheDocument();
    expect(screen.getByText('23,3')).toBeInTheDocument();
  });

  it('given factions when clicking a faction then selects it by name', async () => {
    apiService.default.listarFaccoes.mockResolvedValueOnce(FACCOES);
    const onSelecionarFaccao = vi.fn();

    render(<Faccoes onSelecionarFaccao={onSelecionarFaccao} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Marqueses' }));

    expect(onSelecionarFaccao).toHaveBeenCalledWith('Marqueses');
  });

  it('given no factions when rendering then shows the empty message', async () => {
    apiService.default.listarFaccoes.mockResolvedValueOnce([]);

    render(<Faccoes onSelecionarFaccao={vi.fn()} />);

    expect(await screen.findByText(/Nenhuma facção jogada ainda/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('given a failed request when rendering then shows the error and not the empty message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    apiService.default.listarFaccoes.mockRejectedValueOnce(new Error('Erro 500 ao listar facções'));

    render(<Faccoes onSelecionarFaccao={vi.fn()} />);

    expect(await screen.findByText(/⚠️ Erro ao carregar facções: Erro 500/i)).toBeInTheDocument();
    expect(screen.queryByText(/Nenhuma facção jogada ainda/i)).not.toBeInTheDocument();
  });

  it('given the factions dashboard when rendering then shows its own title and no back button', async () => {
    apiService.default.listarFaccoes.mockResolvedValueOnce(FACCOES);

    render(<Faccoes onSelecionarFaccao={vi.fn()} />);

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('🛡️ Dashboard de Facções');
    expect(screen.queryByRole('button', { name: /Voltar/i })).not.toBeInTheDocument();
  });

  it('given a period when rendering then requests the factions for it', async () => {
    apiService.default.listarFaccoes.mockResolvedValueOnce(FACCOES);

    render(<Faccoes onSelecionarFaccao={vi.fn()} periodo="ano" onMudarPeriodo={vi.fn()} />);

    await screen.findByText('Stark');
    expect(apiService.default.listarFaccoes).toHaveBeenCalledWith('ano');
    expect(screen.getByLabelText('Período:')).toHaveDisplayValue('Este ano');
  });

  it('given a period without games when rendering then shows the empty period message', async () => {
    apiService.default.listarFaccoes.mockResolvedValueOnce([]);

    render(<Faccoes onSelecionarFaccao={vi.fn()} periodo="3m" onMudarPeriodo={vi.fn()} />);

    expect(await screen.findByText(/Nenhuma facção jogada no período \(últimos 3 meses\)/)).toBeInTheDocument();
  });
});
