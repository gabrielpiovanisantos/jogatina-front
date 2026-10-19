// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Ranking from '../../src/pages/Ranking.jsx';
import Dashboard from '../../src/pages/Dashboard.jsx';
import SetupMesa from '../../src/pages/SetupMesa.jsx';
import { limparBanco, semear } from '../support/backend.js';
import { CENARIO_RANKING, RANKING_ESPERADO } from '../support/cenario.js';

const linhasDoRanking = async () => {
  const tabela = await screen.findByRole('table');
  return within(tabela).getAllByRole('row').slice(1); // sem o cabeçalho
};

const cartao = rotulo => screen.getByText(rotulo).closest('.card-estatistica');

describe('Páginas renderizadas contra o backend real', () => {
  beforeEach(() => limparBanco());
  afterEach(() => cleanup());

  describe('Ranking', () => {
    it('mostra os jogadores na ordem e com as partidas calculadas pelo backend', async () => {
      await semear(CENARIO_RANKING);

      render(<Ranking />);
      const linhas = await linhasDoRanking();

      expect(linhas.map(l => l.querySelector('.nome').textContent))
        .toEqual(RANKING_ESPERADO.map(j => j.playerName));
      expect(linhas.map(l => Number(l.querySelector('.partidas').textContent)))
        .toEqual(RANKING_ESPERADO.map(j => j.totalGames));
    });

    it('mostra pontos e vitórias vindos do backend', async () => {
      await semear(CENARIO_RANKING);

      render(<Ranking />);
      const linhas = await linhasDoRanking();

      expect(linhas.map(l => Number(l.querySelector('.pontos').textContent)))
        .toEqual(RANKING_ESPERADO.map(j => j.totalScore));
      expect(linhas.map(l => Number(l.querySelector('.vitorias').textContent)))
        .toEqual(RANKING_ESPERADO.map(j => j.totalVictories));
    });

    it('mostra mensagem de ranking vazio quando não há jogadores', async () => {
      render(<Ranking />);

      expect(await screen.findByText(/Nenhum jogador no ranking ainda/)).toBeInTheDocument();
    });
  });

  describe('Dashboard', () => {
    it('seleciona o líder do ranking e mostra suas estatísticas', async () => {
      await semear(CENARIO_RANKING);

      render(<Dashboard />);
      const seletor = await screen.findByLabelText('Jogador:');

      expect(seletor).toHaveDisplayValue('Ana');
      expect(within(cartao('Partidas Jogadas')).getByText('3')).toBeInTheDocument();
      expect(within(cartao('Facções Diferentes')).getByText('3')).toBeInTheDocument();
      expect(within(cartao('Vitórias')).getByText('2')).toBeInTheDocument();
    });

    it('atualiza as estatísticas ao trocar de jogador', async () => {
      await semear(CENARIO_RANKING);
      const user = userEvent.setup();

      render(<Dashboard />);
      await user.selectOptions(await screen.findByLabelText('Jogador:'), 'Diego');

      expect(within(cartao('Partidas Jogadas')).getByText('2')).toBeInTheDocument();
      expect(within(cartao('Facções Diferentes')).getByText('1')).toBeInTheDocument();
      expect(within(cartao('Vitórias')).getByText('0')).toBeInTheDocument();
    });

    it('mostra mensagem vazia quando não há jogadores', async () => {
      render(<Dashboard />);

      expect(await screen.findByText(/Nenhum jogador encontrado/)).toBeInTheDocument();
    });
  });

  describe('SetupMesa', () => {
    it('organiza 7 jogadores em mesas de 4 e 3 usando o algoritmo do backend', async () => {
      const user = userEvent.setup();
      const nomes = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eva', 'Fábio', 'Gil'];

      render(<SetupMesa dadosMesa={{ data: '2026-12-25', jogo: 'Root', quantidade: 7 }} />);
      const campo = screen.getByPlaceholderText('Nome do jogador...');
      for (const nome of nomes) {
        await user.type(campo, `${nome}{Enter}`);
      }
      await user.click(screen.getByRole('button', { name: /Organizar Mesas/ }));

      expect(await screen.findByText('Mesas Organizadas 🎲')).toBeInTheDocument();
      expect(screen.getByText('🎮 Mesa 1 (4 jogadores)')).toBeInTheDocument();
      expect(screen.getByText('🎮 Mesa 2 (3 jogadores)')).toBeInTheDocument();
      for (const nome of nomes) {
        expect(screen.getByText(nome)).toBeInTheDocument();
      }
    });
  });
});
