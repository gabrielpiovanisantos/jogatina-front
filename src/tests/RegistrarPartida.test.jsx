import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistrarPartida from '../pages/RegistrarPartida.jsx';
import apiService from '../services/api.js';

// Mock do serviço de API
vi.mock('../services/api.js', () => ({
  default: {
    listarJogadores: vi.fn(),
    registrarPartida: vi.fn()
  }
}));

const JOGADORES = [
  { id: 11, name: 'Ana' },
  { id: 22, name: 'Bruno' },
  { id: 33, name: 'Carla' }
];

describe('RegistrarPartida component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('given backend players when rendering then lists them in the player select', async () => {
    apiService.listarJogadores.mockResolvedValue(JOGADORES);

    render(<RegistrarPartida />);

    const select = await screen.findByLabelText('Jogador 1');
    const nomes = Array.from(select.options).map(o => o.textContent);
    expect(nomes).toEqual(['Selecione o Jogador', 'Ana', 'Bruno', 'Carla']);
  });

  it('given a selected player when saving the game then sends the real player id', async () => {
    const user = userEvent.setup();
    apiService.listarJogadores.mockResolvedValue(JOGADORES);
    apiService.registrarPartida.mockResolvedValue({ success: true });

    render(<RegistrarPartida />);

    await user.selectOptions(await screen.findByLabelText('Jogador 1'), 'Bruno');
    await user.selectOptions(screen.getByDisplayValue('Selecione a Facção'), 'Vagabond');
    await user.click(screen.getByRole('button', { name: /Salvar Partida/i }));

    await waitFor(() => expect(apiService.registrarPartida).toHaveBeenCalledTimes(1));
    expect(apiService.registrarPartida.mock.calls[0][0].results).toEqual([
      { playerId: 22, faction: 'Vagabond', points: 0, won: false }
    ]);
  });

  it('given a player chosen in one row when adding another row then disables that player there', async () => {
    const user = userEvent.setup();
    apiService.listarJogadores.mockResolvedValue(JOGADORES);

    render(<RegistrarPartida />);

    await user.selectOptions(await screen.findByLabelText('Jogador 1'), 'Ana');
    await user.click(screen.getByRole('button', { name: /Adicionar Jogador/i }));

    const segunda = screen.getByLabelText('Jogador 2');
    const ana = Array.from(segunda.options).find(o => o.textContent === 'Ana');
    const bruno = Array.from(segunda.options).find(o => o.textContent === 'Bruno');
    expect(ana.disabled).toBe(true);
    expect(bruno.disabled).toBe(false);
  });

  it('given no players when rendering then asks to organize a table first', async () => {
    apiService.listarJogadores.mockResolvedValue([]);

    render(<RegistrarPartida />);

    expect(await screen.findByText(/Nenhum jogador cadastrado ainda/i)).toBeInTheDocument();
  });

  it('given a failed request when loading players then shows the error message', async () => {
    apiService.listarJogadores.mockRejectedValue(new Error('Falha de rede'));

    render(<RegistrarPartida />);

    expect(await screen.findByText(/Erro ao carregar jogadores: Falha de rede/i)).toBeInTheDocument();
  });
});
