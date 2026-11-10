import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SetupMesa, { INTERVALO_ATUALIZACAO_MS } from '../pages/SetupMesa.jsx';
import apiService from '../services/api.js';

vi.mock('../services/api.js', () => ({
  default: {
    obterMesa: vi.fn(),
    adicionarJogadorNaMesa: vi.fn(),
    removerJogadorDaMesa: vi.fn(),
    organizarMesaCompartilhada: vi.fn()
  }
}));

const erroHttp = (status, mensagem) => Object.assign(new Error(mensagem), { status });

// "Backend" em memória: a mesma mesa vista por quem abriu o link
let mesa;
let proximoId;

const copia = () => ({ ...mesa, players: mesa.players.map(p => ({ ...p })) });

// Outra pessoa, em outro navegador, adiciona um nome pelo link
const outraPessoaAdiciona = (nome) => {
  mesa.players.push({ id: proximoId++, name: nome });
};

describe('SetupMesa component', () => {
  const mockOnVoltar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mesa = { id: 'abc234defg', date: '2026-08-15', game: 'Root', expectedPlayers: 6, players: [] };
    proximoId = 1;
    apiService.obterMesa.mockImplementation(async () => copia());
    apiService.adicionarJogadorNaMesa.mockImplementation(async (_id, nome) => {
      if (mesa.players.some(p => p.name.toLowerCase() === nome.toLowerCase())) {
        throw erroHttp(400, 'Esse jogador já está na lista!');
      }
      mesa.players.push({ id: proximoId++, name: nome });
      return copia();
    });
    apiService.removerJogadorDaMesa.mockImplementation(async (_id, jogadorId) => {
      mesa.players = mesa.players.filter(p => p.id !== jogadorId);
      return copia();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const renderizar = async () => {
    render(<SetupMesa mesaId="abc234defg" onVoltar={mockOnVoltar} />);
    return await screen.findByPlaceholderText(/Nome do jogador/i);
  };

  const adicionar = async (user, input, ...nomes) => {
    for (const nome of nomes) {
      await user.type(input, nome);
      await user.click(screen.getByRole('button', { name: '+' }));
      await screen.findByText(nome);
    }
  };

  it('given a table id when rendering then loads the table and shows its information', async () => {
    await renderizar();

    expect(apiService.obterMesa).toHaveBeenCalledWith('abc234defg');
    expect(screen.getByText('15/08/2026')).toBeInTheDocument();
    expect(screen.getByText(/Root/i)).toBeInTheDocument();
    expect(screen.getByText(/6 pessoas/i)).toBeInTheDocument();
    expect(screen.getByText(/Adicione quem vai jogar/i)).toBeInTheDocument();
  });

  it('given a table id when rendering then shows the link to share with the table id', async () => {
    await renderizar();

    expect(screen.getByLabelText(/Envie este link/i).value).toMatch(/#setup\/abc234defg$/);
  });

  it('given the share link when clicking copy then writes it to the clipboard', async () => {
    const user = userEvent.setup();
    await renderizar();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();

    await user.click(screen.getByRole('button', { name: /Copiar link/i }));

    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/#setup\/abc234defg$/));
    expect(await screen.findByRole('button', { name: /Copiado/i })).toBeInTheDocument();
  });

  it('given an unknown table id when rendering then says the table was not found', async () => {
    apiService.obterMesa.mockRejectedValue(erroHttp(404, 'Mesa não encontrada'));
    render(<SetupMesa mesaId="naoexiste" onVoltar={mockOnVoltar} />);

    expect(await screen.findByText('Mesa não encontrada')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Nome do jogador/i)).not.toBeInTheDocument();
  });

  it('given a typed name when clicking add then sends it to the shared table and lists it', async () => {
    const user = userEvent.setup();
    const input = await renderizar();

    await adicionar(user, input, 'João');

    expect(apiService.adicionarJogadorNaMesa).toHaveBeenCalledWith('abc234defg', 'João');
    expect(input).toHaveValue('');
    expect(screen.getByText(/Total de confirmados: 1/i)).toBeInTheDocument();
  });

  it('given someone else adds a name through the link when the refresh runs then shows it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderizar();
    expect(screen.getByText(/Total de confirmados: 0/i)).toBeInTheDocument();

    outraPessoaAdiciona('Maria');
    await act(async () => { await vi.advanceTimersByTimeAsync(INTERVALO_ATUALIZACAO_MS); });

    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.getByText(/Total de confirmados: 1/i)).toBeInTheDocument();
  });

  it('given a refresh that started before adding a name when it answers late then keeps the added name', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = await renderizar();
    // Busca que "sai" antes do clique e só responde depois, com a lista ainda vazia
    let responderBuscaVelha;
    apiService.obterMesa.mockImplementationOnce(() => new Promise(resolve => {
      const velha = copia();
      responderBuscaVelha = () => resolve(velha);
    }));
    await act(async () => { await vi.advanceTimersByTimeAsync(INTERVALO_ATUALIZACAO_MS); });
    expect(responderBuscaVelha).toBeTypeOf('function');

    await adicionar(user, input, 'João');
    await act(async () => { responderBuscaVelha(); });

    expect(screen.getByText('João')).toBeInTheDocument();
  });

  it('given a player already in the list when adding the same name in another case then prevents the duplicate', async () => {
    const user = userEvent.setup();
    const input = await renderizar();
    await adicionar(user, input, 'Ana');

    await user.type(input, 'ana');
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    await user.click(screen.getByRole('button', { name: '+' }));

    expect(alertSpy).toHaveBeenCalledWith('Esse jogador já está na lista!');
    expect(apiService.adicionarJogadorNaMesa).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Total de confirmados: 1/i)).toBeInTheDocument();
  });

  it('given the backend refuses a name when adding it then shows the reason', async () => {
    const user = userEvent.setup();
    const input = await renderizar();
    // Outra pessoa colocou o mesmo nome antes da tela atualizar
    outraPessoaAdiciona('Pedro');

    await user.type(input, 'Pedro');
    await user.click(screen.getByRole('button', { name: '+' }));

    expect(await screen.findByText(/Esse jogador já está na lista!/)).toBeInTheDocument();
    expect(await screen.findByText(/Total de confirmados: 1/i)).toBeInTheDocument();
  });

  it('given a player in the list when clicking remove then removes it from the shared table', async () => {
    const user = userEvent.setup();
    const input = await renderizar();
    await adicionar(user, input, 'João');

    await user.click(screen.getByRole('button', { name: /Remover/i }));

    await waitFor(() => expect(screen.queryByText('João')).not.toBeInTheDocument());
    expect(apiService.removerJogadorDaMesa).toHaveBeenCalledWith('abc234defg', 1);
  });

  it('given fewer than 3 players when on the list then disables the organize button', async () => {
    const user = userEvent.setup();
    const input = await renderizar();
    const botaoOrganizar = screen.getByRole('button', { name: /Organizar Mesas/i });

    expect(botaoOrganizar).toBeDisabled();
    await adicionar(user, input, 'João', 'Maria');
    expect(botaoOrganizar).toBeDisabled();
    await adicionar(user, input, 'Pedro');
    expect(botaoOrganizar).not.toBeDisabled();
  });

  it('given enough players when clicking organize then organizes the shared table and shows the result', async () => {
    const user = userEvent.setup();
    apiService.organizarMesaCompartilhada.mockResolvedValueOnce({
      groups: [[{ id: 1, name: 'João' }, { id: 2, name: 'Maria' }, { id: 3, name: 'Pedro' }]]
    });
    const input = await renderizar();
    await adicionar(user, input, 'João', 'Maria', 'Pedro');

    await user.click(screen.getByRole('button', { name: /Organizar Mesas/i }));

    expect(await screen.findByText(/Mesas Organizadas/i)).toBeInTheDocument();
    expect(apiService.organizarMesaCompartilhada).toHaveBeenCalledWith('abc234defg');
    expect(screen.getByText(/Mesa 1 \(3 jogadores\)/)).toBeInTheDocument();
  });

  it('given a failed API call when organizing then shows the error message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    apiService.organizarMesaCompartilhada.mockRejectedValueOnce(new Error('Erro ao conectar'));
    const input = await renderizar();
    await adicionar(user, input, 'João', 'Maria', 'Pedro');

    await user.click(screen.getByRole('button', { name: /Organizar Mesas/i }));

    expect(await screen.findByText(/⚠️ Falha ao conectar com o servidor/i)).toBeInTheDocument();
  });

  it('given organized tables when clicking reorganize then returns to the player list', async () => {
    const user = userEvent.setup();
    apiService.organizarMesaCompartilhada.mockResolvedValueOnce({
      groups: [[{ id: 1, name: 'João' }, { id: 2, name: 'Maria' }, { id: 3, name: 'Pedro' }]]
    });
    const input = await renderizar();
    await adicionar(user, input, 'João', 'Maria', 'Pedro');
    await user.click(screen.getByRole('button', { name: /Organizar Mesas/i }));
    await screen.findByText(/Mesas Organizadas/i);

    await user.click(screen.getByRole('button', { name: /← Reorganizar/i }));

    expect(screen.queryByText(/Mesas Organizadas/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Total de confirmados: 3/i)).toBeInTheDocument();
  });
});
