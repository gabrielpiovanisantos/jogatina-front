import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistrarPartida from '../pages/RegistrarPartida.jsx';
import apiService from '../services/api.js';
import { paraAAAAMMDD, formatarDataBR } from '../utils/datas.js';

// Mock do serviço de API
vi.mock('../services/api.js', () => ({
  default: {
    listarJogadores: vi.fn(),
    listarFaccoesOficiais: vi.fn(),
    registrarPartida: vi.fn(),
    listarPartidas: vi.fn()
  }
}));

// Mesmo conteúdo de GET /api/factions
const FACCOES_OFICIAIS = [
  'Marqueses',
  'Dinastia das Rapinas',
  'Aliança da Floresta',
  'Malandro',
  'Lagartos Cultistas',
  'Companhia Ribeirinha',
  'Ducado Subterrâneo',
  'Conspiração Corvídea',
  'Senhor das Centenas',
  'Guardiões de Ferro'
];

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
    apiService.listarPartidas.mockResolvedValue([]);
    apiService.listarFaccoesOficiais.mockResolvedValue(FACCOES_OFICIAIS);
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

  it('given the official factions from the backend when rendering then lists them in the faction select in that order', async () => {
    apiService.listarJogadores.mockResolvedValue(JOGADORES);

    render(<RegistrarPartida />);

    await screen.findByLabelText('Jogador 1');
    expect(apiService.listarFaccoesOficiais).toHaveBeenCalledTimes(1);
    const select = screen.getByDisplayValue('Selecione a Facção');
    const nomes = Array.from(select.options).map(o => o.textContent);
    expect(nomes).toEqual(['Selecione a Facção', ...FACCOES_OFICIAIS]);
  });

  it('given a different official list when rendering then shows exactly what the backend sent', async () => {
    apiService.listarJogadores.mockResolvedValue(JOGADORES);
    apiService.listarFaccoesOficiais.mockResolvedValue(['Malandro', 'Marqueses']);

    render(<RegistrarPartida />);

    await screen.findByLabelText('Jogador 1');
    const nomes = Array.from(screen.getByDisplayValue('Selecione a Facção').options).map(o => o.textContent);
    expect(nomes).toEqual(['Selecione a Facção', 'Malandro', 'Marqueses']);
  });

  it('given a pending factions request when rendering then shows the loading message', async () => {
    apiService.listarJogadores.mockResolvedValue(JOGADORES);
    apiService.listarFaccoesOficiais.mockImplementation(() => new Promise(() => {}));

    render(<RegistrarPartida />);

    expect(await screen.findByText(/⏳ Carregando jogadores e facções/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Jogador 1')).not.toBeInTheDocument();
  });

  it('given a failed request when loading factions then shows the error and no form', async () => {
    apiService.listarJogadores.mockResolvedValue(JOGADORES);
    apiService.listarFaccoesOficiais.mockRejectedValue(new Error('Erro 500 ao listar as facções oficiais'));

    render(<RegistrarPartida />);

    expect(await screen.findByText(/⚠️ Erro ao carregar facções: Erro 500/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Salvar Partida/i })).not.toBeInTheDocument();
  });

  it('given the backend rejects an invalid faction with 400 when saving then alerts the message and keeps the form', async () => {
    const user = userEvent.setup();
    apiService.listarJogadores.mockResolvedValue(JOGADORES);
    // A lista na tela pode estar desatualizada em relação à do backend
    apiService.listarFaccoesOficiais.mockResolvedValue(['Stark', ...FACCOES_OFICIAIS]);
    apiService.registrarPartida.mockRejectedValue(new Error('Facção inválida: Stark'));

    render(<RegistrarPartida />);

    await user.selectOptions(await screen.findByLabelText('Jogador 1'), 'Ana');
    await user.selectOptions(screen.getByDisplayValue('Selecione a Facção'), 'Stark');
    await user.click(screen.getByRole('button', { name: /Salvar Partida/i }));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('⚠️ Falha ao registrar partida: Facção inválida: Stark'));
    expect(screen.getByLabelText('Jogador 1')).toHaveDisplayValue('Ana');
    expect(screen.getByDisplayValue('Stark')).toBeInTheDocument();
  });

  it('given a selected player when saving the game then sends the real player id', async () => {
    const user = userEvent.setup();
    apiService.listarJogadores.mockResolvedValue(JOGADORES);
    apiService.registrarPartida.mockResolvedValue({ success: true });

    render(<RegistrarPartida />);

    await user.selectOptions(await screen.findByLabelText('Jogador 1'), 'Bruno');
    await user.selectOptions(screen.getByDisplayValue('Selecione a Facção'), 'Malandro');
    await user.click(screen.getByRole('button', { name: /Salvar Partida/i }));

    await waitFor(() => expect(apiService.registrarPartida).toHaveBeenCalledTimes(1));
    expect(apiService.registrarPartida.mock.calls[0][0].results).toEqual([
      { playerId: 22, faction: 'Malandro', points: 0, won: false }
    ]);
  });

  it('given two games today when rendering then titles the form as the third game of today', async () => {
    apiService.listarJogadores.mockResolvedValue(JOGADORES);
    apiService.listarPartidas.mockResolvedValue([
      { id: 7, dateTime: '2026-10-19T15:00:00Z' },
      { id: 8, dateTime: '2026-10-19T18:00:00Z' }
    ]);
    const hoje = new Date();

    render(<RegistrarPartida />);

    const hojeBR = formatarDataBR(paraAAAAMMDD(hoje));
    expect(await screen.findByRole('heading', { name: `Partida 3 · ${hojeBR}` })).toBeInTheDocument();
    const [inicio, fim] = apiService.listarPartidas.mock.calls[0];
    expect(inicio).toEqual(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
    expect(fim).toEqual(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1));
  });

  it('given another date when changing it then renumbers for that day and saves the game on it', async () => {
    const user = userEvent.setup();
    apiService.listarJogadores.mockResolvedValue(JOGADORES);
    apiService.registrarPartida.mockResolvedValue({ success: true });

    render(<RegistrarPartida />);

    apiService.listarPartidas.mockResolvedValue([{ id: 3, dateTime: '2026-10-01T22:00:00Z' }]);
    fireEvent.change(await screen.findByLabelText('Data da partida:'), { target: { value: '2026-10-01' } });

    expect(await screen.findByRole('heading', { name: 'Partida 2 · 01/10/2026' })).toBeInTheDocument();
    expect(apiService.listarPartidas).toHaveBeenLastCalledWith(new Date(2026, 9, 1), new Date(2026, 9, 2));

    await user.selectOptions(screen.getByLabelText('Jogador 1'), 'Ana');
    await user.selectOptions(screen.getByDisplayValue('Selecione a Facção'), 'Malandro');
    await user.click(screen.getByRole('button', { name: /Salvar Partida/i }));

    await waitFor(() => expect(apiService.registrarPartida).toHaveBeenCalledTimes(1));
    expect(paraAAAAMMDD(new Date(apiService.registrarPartida.mock.calls[0][0].dateTime))).toBe('2026-10-01');
  });

  it('given a saved game when saving succeeds then advances to the next game of the day', async () => {
    const user = userEvent.setup();
    apiService.listarJogadores.mockResolvedValue(JOGADORES);
    apiService.registrarPartida.mockResolvedValue({ success: true });

    render(<RegistrarPartida />);

    expect(await screen.findByRole('heading', { name: /^Partida 1 · / })).toBeInTheDocument();

    apiService.listarPartidas.mockResolvedValue([{ id: 1, dateTime: new Date().toISOString() }]);
    await user.selectOptions(screen.getByLabelText('Jogador 1'), 'Ana');
    await user.selectOptions(screen.getByDisplayValue('Selecione a Facção'), 'Malandro');
    await user.click(screen.getByRole('button', { name: /Salvar Partida/i }));

    expect(await screen.findByRole('heading', { name: /^Partida 2 · / })).toBeInTheDocument();
  });

  it('given the games request fails when rendering then still shows the date without a number', async () => {
    apiService.listarJogadores.mockResolvedValue(JOGADORES);
    apiService.listarPartidas.mockRejectedValue(new Error('Falha de rede'));

    render(<RegistrarPartida />);

    await screen.findByLabelText('Jogador 1');
    await waitFor(() => expect(apiService.listarPartidas).toHaveBeenCalled());
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(`Partida · ${formatarDataBR(paraAAAAMMDD(new Date()))}`);
  });

  it.each([
    'Facção não pode ser vazia',
    'Pontuação não pode ser negativa',
    'Jogador repetido na mesma partida',
    'A partida precisa ter pelo menos um resultado'
  ])('given the backend rejects with "%s" when saving then alerts that message', async (mensagem) => {
    const user = userEvent.setup();
    apiService.listarJogadores.mockResolvedValue(JOGADORES);
    apiService.registrarPartida.mockRejectedValue(new Error(mensagem));

    render(<RegistrarPartida />);

    await user.selectOptions(await screen.findByLabelText('Jogador 1'), 'Ana');
    await user.selectOptions(screen.getByDisplayValue('Selecione a Facção'), 'Malandro');
    await user.click(screen.getByRole('button', { name: /Salvar Partida/i }));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(`⚠️ Falha ao registrar partida: ${mensagem}`));
    // O formulário não é limpo: o usuário corrige e tenta de novo
    expect(screen.getByLabelText('Jogador 1')).toHaveDisplayValue('Ana');
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
