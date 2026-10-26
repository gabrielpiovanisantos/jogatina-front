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
    expect(Array.from(select.options).map(o => o.textContent)).toEqual(
      ['Tudo', 'Últimos 3 meses', 'Últimos 12 meses', 'Este ano', 'Personalizado']
    );
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

  describe('temporadas', () => {
    const SALVOS = [
      { id: 2, name: 'Temporada 2', from: new Date(2026, 3, 1).toISOString(), to: null },
      { id: 1, name: 'Temporada 1', from: new Date(2025, 10, 1).toISOString(), to: new Date(2026, 3, 1).toISOString() }
    ];

    const renderizar = (periodo, onMudar = vi.fn(), extras = {}) => {
      definirPeriodosSalvos(SALVOS);
      return render(
        <PeriodosContexto.Provider value={{ salvos: SALVOS, erro: null, abrirTemporadas: vi.fn(), ...extras }}>
          <SeletorPeriodo periodo={periodo} onMudar={onMudar} />
        </PeriodosContexto.Provider>
      );
    };

    afterEach(() => definirPeriodosSalvos([]));

    it('given saved periods when rendering then lists them in a "Temporadas" group, after the shortcuts', () => {
      renderizar('tudo');

      const grupo = screen.getByRole('group', { name: 'Temporadas' });
      expect(Array.from(grupo.querySelectorAll('option')).map(o => o.textContent)).toEqual(['Temporada 2', 'Temporada 1']);
      expect(Array.from(screen.getByLabelText('Período:').options).map(o => o.textContent)).toEqual(
        ['Tudo', 'Últimos 3 meses', 'Últimos 12 meses', 'Este ano', 'Temporada 2', 'Temporada 1', 'Personalizado']
      );
    });

    it('given a season when choosing it then reports "salvo:<id>"', async () => {
      const onMudar = vi.fn();
      renderizar('tudo', onMudar);

      await userEvent.selectOptions(screen.getByLabelText('Período:'), 'Temporada 1');

      expect(onMudar).toHaveBeenCalledWith('salvo:1');
    });

    it('given a selected season when rendering then shows its name and dates', () => {
      const { unmount } = renderizar('salvo:1');
      expect(screen.getByText('Temporada 1: 01/11/2025 – 31/03/2026')).toBeInTheDocument();
      unmount();

      renderizar('salvo:2');
      expect(screen.getByLabelText('Período:')).toHaveDisplayValue('Temporada 2');
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

    it('given the seasons screen is available when clicking the manage button then opens it', async () => {
      const abrirTemporadas = vi.fn();
      renderizar('tudo', vi.fn(), { abrirTemporadas });

      await userEvent.click(screen.getByRole('button', { name: /Gerenciar temporadas/ }));

      expect(abrirTemporadas).toHaveBeenCalledTimes(1);
    });

    it('given the saved periods failed to load when rendering then shows the error and keeps the shortcuts', () => {
      renderizar('tudo', vi.fn(), { salvos: [], erro: 'Não foi possível carregar os períodos salvos: Erro 500' });

      expect(screen.getByText(/Não foi possível carregar os períodos salvos/)).toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Temporadas' })).not.toBeInTheDocument();
      expect(screen.getByLabelText('Período:')).toHaveDisplayValue('Tudo');
    });
  });

  it('given no provider when rendering then has no seasons group and no manage button', () => {
    render(<SeletorPeriodo periodo="tudo" onMudar={vi.fn()} />);

    expect(screen.queryByRole('group', { name: 'Temporadas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Gerenciar temporadas/ })).not.toBeInTheDocument();
  });
});
