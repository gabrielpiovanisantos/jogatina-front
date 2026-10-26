import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SeletorPeriodo from '../components/SeletorPeriodo.jsx';
import { PeriodosContexto } from '../utils/periodosContexto.js';
import { definirPeriodosSalvos } from '../utils/periodo.js';

describe('SeletorPeriodo component', () => {
  it('given the shortcuts when rendering then offers them plus a custom range, with the current one selected', () => {
    render(<SeletorPeriodo periodo="12m" onMudar={vi.fn()} />);

    const select = screen.getByLabelText('Período:');
    // "—" é o estado neutro de quando vale uma temporada; não dá para escolher
    expect(Array.from(select.options).map(o => o.textContent)).toEqual(
      ['—', 'Tudo', 'Últimos 3 meses', 'Últimos 12 meses', 'Este ano', 'Personalizado']
    );
    expect(select.options[0]).toBeDisabled();
    expect(select).toHaveDisplayValue('Últimos 12 meses');
  });

  it('given a shortcut when choosing it then reports it right away', async () => {
    const onMudar = vi.fn();
    render(<SeletorPeriodo periodo="tudo" onMudar={onMudar} />);

    await userEvent.selectOptions(screen.getByLabelText('Período:'), 'Este ano');

    expect(onMudar).toHaveBeenCalledWith('ano');
  });

  it('given a custom range when filling only one date then waits for the other', async () => {
    const onMudar = vi.fn();
    render(<SeletorPeriodo periodo="tudo" onMudar={onMudar} />);

    await userEvent.selectOptions(screen.getByLabelText('Período:'), 'Personalizado');
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-01-01' } });
    expect(onMudar).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-03-31' } });
    expect(onMudar).toHaveBeenCalledWith('2026-01-01_2026-03-31');
  });

  it('given a custom range with the dates inverted when filling them then warns and does not report', async () => {
    const onMudar = vi.fn();
    render(<SeletorPeriodo periodo="tudo" onMudar={onMudar} />);

    await userEvent.selectOptions(screen.getByLabelText('Período:'), 'Personalizado');
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-03-31' } });
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-01-01' } });

    expect(screen.getByRole('alert')).toHaveTextContent(/data inicial precisa ser anterior/i);
    expect(onMudar).not.toHaveBeenCalled();
  });

  it('given a custom period from the url when rendering then shows its dates', () => {
    render(<SeletorPeriodo periodo="2026-01-01_2026-03-31" onMudar={vi.fn()} />);

    expect(screen.getByLabelText('Período:')).toHaveDisplayValue('Personalizado');
    expect(screen.getByLabelText('De')).toHaveValue('2026-01-01');
    expect(screen.getByLabelText('Até')).toHaveValue('2026-03-31');
  });

  describe('temporada selector', () => {
    const SALVOS = [
      { id: 2, name: 'Temporada 2', from: new Date(2026, 3, 1).toISOString(), to: null },
      { id: 1, name: 'Temporada 1', from: new Date(2025, 10, 1).toISOString(), to: new Date(2026, 3, 1).toISOString() }
    ];

    const renderizar = (periodo, onMudar = vi.fn(), extras = {}) => {
      const salvos = extras.salvos ?? SALVOS;
      definirPeriodosSalvos(salvos);
      return render(
        <PeriodosContexto.Provider value={{ salvos, erro: null, ...extras }}>
          <SeletorPeriodo periodo={periodo} onMudar={onMudar} />
        </PeriodosContexto.Provider>
      );
    };

    const periodoSelect = () => screen.getByLabelText('Período:');
    const temporadaSelect = () => screen.getByLabelText('Temporada:');

    afterEach(() => definirPeriodosSalvos([]));

    it('given saved seasons when rendering then they are in their own labelled selector, not in the period one', () => {
      renderizar('tudo');

      expect(Array.from(temporadaSelect().options).map(o => o.textContent)).toEqual(['—', 'Temporada 2', 'Temporada 1']);
      expect(Array.from(periodoSelect().options).map(o => o.textContent)).not.toContain('Temporada 1');
      expect(screen.queryByRole('group', { name: 'Temporadas' })).not.toBeInTheDocument();
    });

    it('given the default when rendering then the period is "Tudo" and the season is empty', () => {
      renderizar('tudo');

      expect(periodoSelect()).toHaveDisplayValue('Tudo');
      expect(temporadaSelect()).toHaveDisplayValue('—');
      expect(temporadaSelect()).toBeEnabled();
    });

    it('given a season when choosing it then reports "salvo:<id>"', async () => {
      const onMudar = vi.fn();
      renderizar('3m', onMudar);

      await userEvent.selectOptions(temporadaSelect(), 'Temporada 1');

      expect(onMudar).toHaveBeenCalledWith('salvo:1');
    });

    it('given a season is selected when rendering then the period selector is neutral', () => {
      renderizar('salvo:1');

      expect(temporadaSelect()).toHaveDisplayValue('Temporada 1');
      expect(periodoSelect()).toHaveDisplayValue('—');
    });

    it('given a season is selected when choosing a period then reports the period, which clears the season', async () => {
      const onMudar = vi.fn();
      renderizar('salvo:1', onMudar);

      await userEvent.selectOptions(periodoSelect(), 'Últimos 3 meses');

      expect(onMudar).toHaveBeenCalledWith('3m');
    });

    it('given a period is selected when rendering then the season selector is empty', () => {
      renderizar('12m');

      expect(periodoSelect()).toHaveDisplayValue('Últimos 12 meses');
      expect(temporadaSelect()).toHaveDisplayValue('—');
    });

    it('given a season is selected when clearing it then goes back to "Tudo"', async () => {
      const onMudar = vi.fn();
      renderizar('salvo:2', onMudar);

      await userEvent.selectOptions(temporadaSelect(), '—');

      expect(onMudar).toHaveBeenCalledWith('tudo');
    });

    it('given a custom range is selected when choosing a season then hides the date fields', async () => {
      const onMudar = vi.fn();
      const { rerender } = renderizar('2026-01-01_2026-03-31', onMudar);
      expect(screen.getByLabelText('De')).toBeInTheDocument();

      await userEvent.selectOptions(temporadaSelect(), 'Temporada 2');
      expect(onMudar).toHaveBeenCalledWith('salvo:2');
      rerender(
        <PeriodosContexto.Provider value={{ salvos: SALVOS, erro: null }}>
          <SeletorPeriodo periodo="salvo:2" onMudar={onMudar} />
        </PeriodosContexto.Provider>
      );

      expect(screen.queryByLabelText('De')).not.toBeInTheDocument();
      expect(periodoSelect()).toHaveDisplayValue('—');
    });

    it('given a selected season when rendering then shows its name and dates', () => {
      const { unmount } = renderizar('salvo:1');
      expect(screen.getByText('Temporada 1: 01/11/2025 – 31/03/2026')).toBeInTheDocument();
      unmount();

      renderizar('salvo:2');
      expect(screen.getByText('Temporada 2: 01/04/2026 – hoje')).toBeInTheDocument();
    });

    it('given a shortcut when rendering then also shows its dates', () => {
      renderizar('3m');

      expect(screen.getByText(/^Últimos 3 meses: \d{2}\/\d{2}\/\d{4} – hoje$/)).toBeInTheDocument();
    });

    it('given "Tudo" when rendering then shows no dates', () => {
      renderizar('tudo');

      expect(screen.queryByText(/– hoje/)).not.toBeInTheDocument();
    });

    it('given no seasons when rendering then the season selector is disabled with "Nenhuma temporada"', () => {
      renderizar('tudo', vi.fn(), { salvos: [] });

      expect(temporadaSelect()).toBeDisabled();
      expect(temporadaSelect()).toHaveDisplayValue('Nenhuma temporada');
      expect(periodoSelect()).toBeEnabled();
    });

    it('given the seasons failed to load when rendering then the error stays with the season selector and the period one keeps working', async () => {
      const onMudar = vi.fn();
      renderizar('tudo', onMudar, { salvos: [], erro: 'Não foi possível carregar os períodos salvos: Erro 500' });

      expect(temporadaSelect()).toBeDisabled();
      expect(temporadaSelect()).toHaveAccessibleDescription('⚠️ Não foi possível carregar os períodos salvos: Erro 500');
      await userEvent.selectOptions(periodoSelect(), 'Este ano');
      expect(onMudar).toHaveBeenCalledWith('ano');
    });

    it('given the selector when rendering then has no manage link anymore', () => {
      renderizar('tudo');

      expect(screen.queryByRole('button', { name: /Gerenciar temporadas/ })).not.toBeInTheDocument();
    });
  });

  it('given no provider when rendering then the season selector is disabled and empty', () => {
    render(<SeletorPeriodo periodo="tudo" onMudar={vi.fn()} />);

    expect(screen.getByLabelText('Temporada:')).toBeDisabled();
    expect(screen.getByLabelText('Período:')).toHaveDisplayValue('Tudo');
  });
});
