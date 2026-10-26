import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Temporadas from '../pages/Temporadas.jsx';
import { PeriodosContexto } from '../utils/periodosContexto.js';
import { definirPeriodosSalvos } from '../utils/periodo.js';
import { paraAAAAMMDD } from '../utils/datas.js';

// Datas locais, como as que a tela manda (meia-noite no fuso do usuário)
const meiaNoite = (ano, mes, dia) => new Date(ano, mes - 1, dia).toISOString();

const EM_ANDAMENTO = { id: 2, name: 'Temporada 2', from: meiaNoite(2026, 4, 1), to: null };
const ENCERRADA = { id: 1, name: 'Temporada 1', from: meiaNoite(2025, 11, 1), to: meiaNoite(2026, 4, 1) };

describe('Temporadas page', () => {
  let contexto;

  const renderizar = (salvos = [EM_ANDAMENTO, ENCERRADA], onVerRanking = vi.fn()) => {
    definirPeriodosSalvos(salvos);
    contexto = {
      salvos,
      erro: null,
      criarPeriodo: vi.fn(async (dados) => ({ id: 3, name: dados.name, from: dados.from, to: dados.to })),
      atualizarPeriodo: vi.fn(async (id, dados) => ({ id, ...dados })),
      excluirPeriodo: vi.fn(async () => {}),
      abrirTemporadas: vi.fn()
    };
    render(
      <PeriodosContexto.Provider value={contexto}>
        <Temporadas onVerRanking={onVerRanking} />
      </PeriodosContexto.Provider>
    );
    return { onVerRanking };
  };

  const preencherNova = async (nome, inicio, fim) => {
    const form = screen.getByRole('region', { name: 'Nova temporada' });
    await userEvent.type(within(form).getByLabelText('Nome'), nome);
    if (inicio) fireEvent.change(within(form).getByLabelText('Início'), { target: { value: inicio } });
    if (fim) fireEvent.change(within(form).getByLabelText('Fim (opcional)'), { target: { value: fim } });
    return form;
  };

  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    definirPeriodosSalvos([]);
  });

  describe('new season', () => {
    it('given the form when rendering then starts today with an empty optional end', () => {
      renderizar([]);

      const form = screen.getByRole('region', { name: 'Nova temporada' });
      expect(within(form).getByLabelText('Início')).toHaveValue(paraAAAAMMDD(new Date()));
      expect(within(form).getByLabelText('Fim (opcional)')).toHaveValue('');
      expect(within(form).getByLabelText('Nome')).toBeRequired();
    });

    it('given a name and a start when creating then sends local midnight and a null end, and offers the ranking', async () => {
      const { onVerRanking } = renderizar([]);

      const form = await preencherNova('  Temporada 3  ', '2026-10-01');
      await userEvent.click(within(form).getByRole('button', { name: 'Criar temporada' }));

      await waitFor(() => expect(contexto.criarPeriodo).toHaveBeenCalledWith({
        name: 'Temporada 3', from: meiaNoite(2026, 10, 1), to: null
      }));
      expect(await screen.findByRole('status')).toHaveTextContent('Temporada "Temporada 3" criada');
      await userEvent.click(screen.getByRole('button', { name: /Ver o Ranking nesta temporada/ }));
      expect(onVerRanking).toHaveBeenCalledWith(3);
    });

    it('given an end date when creating then sends the next midnight as the exclusive end', async () => {
      renderizar([]);

      const form = await preencherNova('Verão', '2026-12-21', '2027-03-19');
      await userEvent.click(within(form).getByRole('button', { name: 'Criar temporada' }));

      await waitFor(() => expect(contexto.criarPeriodo).toHaveBeenCalledWith({
        name: 'Verão', from: meiaNoite(2026, 12, 21), to: meiaNoite(2027, 3, 20)
      }));
    });

    it('given an end before the start when creating then explains and does not call the backend', async () => {
      renderizar([]);

      const form = await preencherNova('Errada', '2026-10-10', '2026-10-01');
      await userEvent.click(within(form).getByRole('button', { name: 'Criar temporada' }));

      expect(await within(form).findByRole('alert')).toHaveTextContent('fim precisa ser igual ou posterior');
      expect(contexto.criarPeriodo).not.toHaveBeenCalled();
    });

    it('given a backend error when creating then shows it and keeps the form', async () => {
      renderizar([]);
      const form = await preencherNova('Temporada 1', '2026-10-01');
      contexto.criarPeriodo.mockRejectedValueOnce(new Error('Já existe um período com o nome: Temporada 1'));

      await userEvent.click(within(form).getByRole('button', { name: 'Criar temporada' }));

      expect(await within(form).findByRole('alert')).toHaveTextContent('⚠️ Já existe um período com o nome: Temporada 1');
      expect(within(form).getByLabelText('Nome')).toHaveValue('Temporada 1');
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('closing the season in progress', () => {
    it('given a season in progress when rendering then offers to close it, checked by default', () => {
      renderizar();

      expect(screen.getByLabelText('Encerrar a temporada "Temporada 2" no início da nova')).toBeChecked();
    });

    it('given no season in progress when rendering then does not offer to close one', () => {
      renderizar([ENCERRADA]);

      expect(screen.queryByLabelText(/Encerrar a temporada/)).not.toBeInTheDocument();
    });

    it('given the option checked when creating then POSTs the new one first and then PUTs the old one ending at the new start', async () => {
      renderizar();
      const ordem = [];
      contexto.criarPeriodo.mockImplementationOnce(async (dados) => { ordem.push('POST'); return { id: 3, ...dados }; });
      contexto.atualizarPeriodo.mockImplementationOnce(async () => { ordem.push('PUT'); return {}; });

      const form = await preencherNova('Temporada 3', '2026-10-01');
      await userEvent.click(within(form).getByRole('button', { name: 'Criar temporada' }));

      await waitFor(() => expect(contexto.atualizarPeriodo).toHaveBeenCalledWith(2, {
        name: 'Temporada 2', from: EM_ANDAMENTO.from, to: meiaNoite(2026, 10, 1)
      }));
      expect(ordem).toEqual(['POST', 'PUT']);
    });

    it('given the option unchecked when creating then leaves the season in progress alone', async () => {
      renderizar();

      await userEvent.click(screen.getByLabelText(/Encerrar a temporada/));
      const form = await preencherNova('Paralela', '2026-10-01');
      await userEvent.click(within(form).getByRole('button', { name: 'Criar temporada' }));

      await waitFor(() => expect(contexto.criarPeriodo).toHaveBeenCalled());
      expect(contexto.atualizarPeriodo).not.toHaveBeenCalled();
    });

    it('given the creation fails when closing was checked then does not touch the season in progress', async () => {
      renderizar();
      contexto.criarPeriodo.mockRejectedValueOnce(new Error('Nome do período não pode ser vazio'));

      const form = await preencherNova('x', '2026-10-01');
      await userEvent.click(within(form).getByRole('button', { name: 'Criar temporada' }));

      expect(await within(form).findByRole('alert')).toHaveTextContent('Nome do período não pode ser vazio');
      expect(contexto.atualizarPeriodo).not.toHaveBeenCalled();
    });

    it('given closing the old one fails when creating then keeps the new one and explains what is left to do', async () => {
      renderizar();
      contexto.atualizarPeriodo.mockRejectedValueOnce(new Error('Erro 500 ao atualizar período'));

      const form = await preencherNova('Temporada 3', '2026-10-01');
      await userEvent.click(within(form).getByRole('button', { name: 'Criar temporada' }));

      expect(await screen.findByRole('status')).toHaveTextContent('Temporada "Temporada 3" criada');
      expect(screen.getByText(/foi criada, mas não deu para encerrar "Temporada 2": Erro 500/)).toBeInTheDocument();
    });

    it('given a new start not after the one in progress when closing is checked then refuses before calling the backend', async () => {
      renderizar();

      const form = await preencherNova('Antiga', '2026-03-01');
      await userEvent.click(within(form).getByRole('button', { name: 'Criar temporada' }));

      expect(await within(form).findByRole('alert')).toHaveTextContent('precisa começar depois do início de "Temporada 2"');
      expect(contexto.criarPeriodo).not.toHaveBeenCalled();
    });
  });

  describe('existing seasons', () => {
    const itemDe = (nome) => screen.getAllByRole('listitem').find(li => within(li).queryByText(nome, { selector: 'strong' }));

    it('given seasons when rendering then lists them with their dates, marking the one in progress', () => {
      renderizar();

      const itens = screen.getAllByRole('listitem');
      expect(itens).toHaveLength(2);
      expect(itens[0]).toHaveTextContent('Temporada 2 em andamento');
      expect(itens[0]).toHaveTextContent('01/04/2026 – hoje');
      expect(itens[1]).toHaveTextContent('01/11/2025 – 31/03/2026');
    });

    it('given no seasons when rendering then shows the empty message', () => {
      renderizar([]);

      expect(screen.getByText(/Nenhuma temporada ainda/)).toBeInTheDocument();
    });

    it('given a season when clicking Ranking then opens the ranking for it', async () => {
      const { onVerRanking } = renderizar();

      await userEvent.click(screen.getByRole('button', { name: 'Ranking de Temporada 1' }));

      expect(onVerRanking).toHaveBeenCalledWith(1);
    });

    it('given a season when editing then prefills the inclusive end and saves the whole object', async () => {
      renderizar();

      await userEvent.click(screen.getByRole('button', { name: 'Editar Temporada 1' }));
      const form = screen.getByRole('form', { name: 'Editar Temporada 1' });
      expect(within(form).getByLabelText('Nome')).toHaveValue('Temporada 1');
      expect(within(form).getByLabelText('Início')).toHaveValue('2025-11-01');
      expect(within(form).getByLabelText('Fim (opcional)')).toHaveValue('2026-03-31');

      fireEvent.change(within(form).getByLabelText('Fim (opcional)'), { target: { value: '' } });
      await userEvent.click(within(form).getByRole('button', { name: 'Salvar' }));

      await waitFor(() => expect(contexto.atualizarPeriodo).toHaveBeenCalledWith(1, {
        name: 'Temporada 1', from: meiaNoite(2025, 11, 1), to: null
      }));
      await waitFor(() => expect(screen.queryByRole('form', { name: 'Editar Temporada 1' })).not.toBeInTheDocument());
    });

    it('given a backend error when saving an edit then shows it and keeps editing', async () => {
      renderizar();
      contexto.atualizarPeriodo.mockRejectedValueOnce(new Error('Já existe um período com o nome: Temporada 2'));

      await userEvent.click(screen.getByRole('button', { name: 'Editar Temporada 1' }));
      const form = screen.getByRole('form', { name: 'Editar Temporada 1' });
      await userEvent.click(within(form).getByRole('button', { name: 'Salvar' }));

      expect(await screen.findByText('⚠️ Já existe um período com o nome: Temporada 2')).toBeInTheDocument();
      expect(screen.getByRole('form', { name: 'Editar Temporada 1' })).toBeInTheDocument();
    });

    it('given a season when deleting and confirming then deletes it', async () => {
      renderizar();

      await userEvent.click(within(itemDe('Temporada 1')).getByRole('button', { name: 'Excluir Temporada 1' }));

      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Excluir a temporada "Temporada 1"?'));
      expect(contexto.excluirPeriodo).toHaveBeenCalledWith(1);
    });

    it('given a season when deleting and cancelling then keeps it', async () => {
      renderizar();
      window.confirm.mockReturnValueOnce(false);

      await userEvent.click(screen.getByRole('button', { name: 'Excluir Temporada 1' }));

      expect(contexto.excluirPeriodo).not.toHaveBeenCalled();
    });

    it('given a backend error when deleting then shows it', async () => {
      renderizar();
      contexto.excluirPeriodo.mockRejectedValueOnce(new Error('Erro 404 ao excluir período'));

      await userEvent.click(screen.getByRole('button', { name: 'Excluir Temporada 1' }));

      expect(await screen.findByText('⚠️ Erro 404 ao excluir período')).toBeInTheDocument();
    });
  });
});
