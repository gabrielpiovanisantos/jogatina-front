import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SetupMesa from '../pages/SetupMesa.jsx';
import * as apiService from '../services/api.js';

// Mock do serviço de API
vi.mock('../services/api.js', () => ({
  default: {
    organizarMesas: vi.fn()
  }
}));

describe('Componente SetupMesa', () => {
  const mockDadosMesa = {
    data: '2026-08-15',
    jogo: 'Root',
    quantidade: 6
  };

  const mockOnVoltar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve renderizar o componente', () => {
    render(<SetupMesa dadosMesa={mockDadosMesa} onVoltar={mockOnVoltar} />);

    expect(screen.getByText(/Adicione quem vai jogar/i)).toBeInTheDocument();
  });

  it('deve exibir informações da mesa se fornecidas', () => {
    render(<SetupMesa dadosMesa={mockDadosMesa} onVoltar={mockOnVoltar} />);

    expect(screen.getByText(/2026-08-15/i)).toBeInTheDocument();
    expect(screen.getByText(/Root/i)).toBeInTheDocument();
    expect(screen.getByText(/6 pessoas/i)).toBeInTheDocument();
  });

  it('deve ter input para adicionar jogador', () => {
    render(<SetupMesa dadosMesa={mockDadosMesa} onVoltar={mockOnVoltar} />);

    const input = screen.getByPlaceholderText(/Nome do jogador/i);
    expect(input).toBeInTheDocument();
  });

  it('deve adicionar jogador quando input é preenchido e botão clicado', async () => {
    const user = userEvent.setup();
    render(<SetupMesa dadosMesa={mockDadosMesa} onVoltar={mockOnVoltar} />);

    const input = screen.getByPlaceholderText(/Nome do jogador/i);
    const botaoAdicionar = screen.getByRole('button', { name: '+' });

    // Adicionar 3 jogadores para habilitar o botão de organizar
    // Adicionar 3 jogadores para habilitar o botão e organizar mesas
    // Adicionar 3 jogadores para permitir organização
    await user.type(input, 'João');
    await user.click(botaoAdicionar);
    await user.type(input, 'Maria');
    await user.click(botaoAdicionar);
    await user.type(input, 'Pedro');
    await user.click(botaoAdicionar);
    await user.type(input, 'Maria');
    await user.click(botaoAdicionar);
    await user.type(input, 'Pedro');
    await user.click(botaoAdicionar);
    await user.type(input, 'Maria');
    await user.click(botaoAdicionar);
    await user.type(input, 'Pedro');
    await user.click(botaoAdicionar);

    expect(screen.getByText('João')).toBeInTheDocument();
  });

  it('deve impedir adicionar jogador duplicado', async () => {
    const user = userEvent.setup();
    render(<SetupMesa dadosMesa={mockDadosMesa} onVoltar={mockOnVoltar} />);

    const input = screen.getByPlaceholderText(/Nome do jogador/i);
    const botaoAdicionar = screen.getByRole('button', { name: '+' });

    await user.type(input, 'João');
    await user.click(botaoAdicionar);

    // Tentar adicionar novamente
    await user.type(input, 'João');
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    await user.click(botaoAdicionar);

    expect(alertSpy).toHaveBeenCalledWith('Esse jogador já está na lista!');
    alertSpy.mockRestore();
  });

  it('deve remover jogador quando botão remover é clicado', async () => {
    const user = userEvent.setup();
    render(<SetupMesa dadosMesa={mockDadosMesa} onVoltar={mockOnVoltar} />);

    const input = screen.getByPlaceholderText(/Nome do jogador/i);
    const botaoAdicionar = screen.getByRole('button', { name: '+' });

    await user.type(input, 'João');
    await user.click(botaoAdicionar);

    expect(screen.getByText('João')).toBeInTheDocument();

    const botaoRemover = screen.getByRole('button', { name: /Remover/i });
    await user.click(botaoRemover);

    await waitFor(() => {
      expect(screen.queryByText('João')).not.toBeInTheDocument();
    });
  });

  it('deve desabilitar botão organizar com menos de 3 jogadores', async () => {
    const user = userEvent.setup();
    render(<SetupMesa dadosMesa={mockDadosMesa} onVoltar={mockOnVoltar} />);

    const input = screen.getByPlaceholderText(/Nome do jogador/i);
    const botaoAdicionar = screen.getByRole('button', { name: '+' });
    const botaoOrganizar = screen.getByRole('button', { name: /Organizar Mesas/i });

    // Começar desabilitado
    expect(botaoOrganizar).toBeDisabled();

    // Adicionar 1 jogador
    await user.type(input, 'João');
    await user.click(botaoAdicionar);
    expect(botaoOrganizar).toBeDisabled();

    // Adicionar 2º jogador
    await user.type(input, 'Maria');
    await user.click(botaoAdicionar);
    expect(botaoOrganizar).toBeDisabled();

    // Adicionar 3º jogador
    await user.type(input, 'Pedro');
    await user.click(botaoAdicionar);
    expect(botaoOrganizar).not.toBeDisabled();
  });

  it('deve chamar organizarMesas quando botão organizar é clicado', async () => {
    const user = userEvent.setup();
    apiService.default.organizarMesas.mockResolvedValueOnce({
      groups: [[], []]
    });

    render(<SetupMesa dadosMesa={mockDadosMesa} onVoltar={mockOnVoltar} />);

    const input = screen.getByPlaceholderText(/Nome do jogador/i);
    const botaoAdicionar = screen.getByRole('button', { name: '+' });

    // Adicionar 3 jogadores
    await user.type(input, 'João');
    await user.click(botaoAdicionar);
    await user.type(input, 'Maria');
    await user.click(botaoAdicionar);
    await user.type(input, 'Pedro');
    await user.click(botaoAdicionar);

    const botaoOrganizar = screen.getByRole('button', { name: /Organizar Mesas/i });
    await user.click(botaoOrganizar);

    await waitFor(() => {
      expect(apiService.default.organizarMesas).toHaveBeenCalled();
    });
  });

  it('deve exibir mesas organizadas após chamada de API', async () => {
    const user = userEvent.setup();
    const mockGroups = [
      [
        { id: 1, name: 'João' },
        { id: 3, name: 'Pedro' }
      ],
      [
        { id: 2, name: 'Maria' }
      ]
    ];

    apiService.default.organizarMesas.mockResolvedValueOnce({
      groups: mockGroups
    });

    render(<SetupMesa dadosMesa={mockDadosMesa} onVoltar={mockOnVoltar} />);

    const input = screen.getByPlaceholderText(/Nome do jogador/i);
    const botaoAdicionar = screen.getByRole('button', { name: '+' });

    await user.type(input, 'João');
    await user.click(botaoAdicionar);
    await user.type(input, 'Maria');
    await user.click(botaoAdicionar);
    await user.type(input, 'Pedro');
    await user.click(botaoAdicionar);

    const botaoOrganizar = screen.getByRole('button', { name: /Organizar Mesas/i });
    await user.click(botaoOrganizar);

    await waitFor(() => {
      expect(screen.getByText(/Mesas Organizadas/i)).toBeInTheDocument();
      expect(screen.getByText('João')).toBeInTheDocument();
      expect(screen.getByText('Maria')).toBeInTheDocument();
      expect(screen.getByText('Pedro')).toBeInTheDocument();
    });
  });

  it('deve exibir erro quando chamada de API falha', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    apiService.default.organizarMesas.mockRejectedValueOnce(
      new Error('Erro ao conectar')
    );

    render(<SetupMesa dadosMesa={mockDadosMesa} onVoltar={mockOnVoltar} />);

    const input = screen.getByPlaceholderText(/Nome do jogador/i);
    const botaoAdicionar = screen.getByRole('button', { name: '+' });

    await user.type(input, 'João');
    await user.click(botaoAdicionar);
    await user.type(input, 'Maria');
    await user.click(botaoAdicionar);
    await user.type(input, 'Pedro');
    await user.click(botaoAdicionar);

    const botaoOrganizar = screen.getByRole('button', { name: /Organizar Mesas/i });
    await user.click(botaoOrganizar);

    await waitFor(() => {
      expect(screen.getByText(/⚠️ Falha ao conectar com o servidor/i)).toBeInTheDocument();
    });
  });

  it('deve permitir reorganizar mesas', async () => {
    const user = userEvent.setup();
    apiService.default.organizarMesas.mockResolvedValueOnce({
      groups: [[{ id: 1, name: 'João' }, { id: 2, name: 'Maria' }, { id: 3, name: 'Pedro' }]]
    });

    render(<SetupMesa dadosMesa={mockDadosMesa} onVoltar={mockOnVoltar} />);

    const input = screen.getByPlaceholderText(/Nome do jogador/i);
    const botaoAdicionar = screen.getByRole('button', { name: '+' });

    await user.type(input, 'João');
    await user.click(botaoAdicionar);
    await user.type(input, 'Maria');
    await user.click(botaoAdicionar);
    await user.type(input, 'Pedro');
    await user.click(botaoAdicionar);

    const botaoOrganizar = screen.getByRole('button', { name: /Organizar Mesas/i });
    await user.click(botaoOrganizar);

    await waitFor(() => {
      expect(screen.getByText(/Mesas Organizadas/i)).toBeInTheDocument();
    });

    const botaoReorganizar = screen.getByRole('button', { name: /← Reorganizar/i });
    await user.click(botaoReorganizar);

    expect(screen.queryByText(/Mesas Organizadas/i)).not.toBeInTheDocument();
  });

  it('deve contar total de confirmados corretamente', async () => {
    const user = userEvent.setup();
    render(<SetupMesa dadosMesa={mockDadosMesa} onVoltar={mockOnVoltar} />);

    const input = screen.getByPlaceholderText(/Nome do jogador/i);
    const botaoAdicionar = screen.getByRole('button', { name: '+' });

    expect(screen.getByText(/Total de confirmados: 0/i)).toBeInTheDocument();

    await user.type(input, 'João');
    await user.click(botaoAdicionar);
    expect(screen.getByText(/Total de confirmados: 1/i)).toBeInTheDocument();

    await user.type(input, 'Maria');
    await user.click(botaoAdicionar);
    expect(screen.getByText(/Total de confirmados: 2/i)).toBeInTheDocument();
  });
});

