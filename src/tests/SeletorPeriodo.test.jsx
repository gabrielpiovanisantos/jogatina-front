import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SeletorPeriodo from '../components/SeletorPeriodo.jsx';

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
});
