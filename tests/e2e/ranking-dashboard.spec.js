import { test, expect } from '@playwright/test';
import { limparBanco, semear } from '../support/backend.js';
import { CENARIO_RANKING, RANKING_ESPERADO } from '../support/cenario.js';

const linhas = page => page.locator('tbody tr.linha-jogador');
const cartao = (page, rotulo) => page.locator('.card-estatistica', { hasText: rotulo }).locator('.card-valor');

test.describe('Ranking e Dashboard com dados do backend', () => {
  test.beforeEach(async () => {
    await limparBanco();
  });

  test('ranking lista os jogadores na ordem calculada pelo backend', async ({ page }) => {
    await semear(CENARIO_RANKING);
    await page.goto('/');

    await page.getByRole('button', { name: '🏆 Ranking' }).click();

    await expect(linhas(page).locator('.nome')).toHaveText(RANKING_ESPERADO.map(j => j.playerName));
    await expect(linhas(page).locator('.posicao')).toHaveText(['🥇', '🥈', '🥉', '#4', '#5']);
    await expect(linhas(page).locator('.partidas')).toHaveText(RANKING_ESPERADO.map(j => String(j.totalGames)));
  });

  test('ranking mostra pontos e vitórias', async ({ page }) => {
    await semear(CENARIO_RANKING);
    await page.goto('/');

    await page.getByRole('button', { name: '🏆 Ranking' }).click();

    await expect(linhas(page).locator('.pontos')).toHaveText(RANKING_ESPERADO.map(j => String(j.totalScore)));
    await expect(linhas(page).locator('.vitorias')).toHaveText(RANKING_ESPERADO.map(j => String(j.totalVictories)));
  });

  test('ranking vazio mostra mensagem de incentivo', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: '🏆 Ranking' }).click();

    await expect(page.getByText(/Nenhum jogador no ranking ainda/)).toBeVisible();
  });

  test('dashboard mostra as estatísticas do jogador escolhido', async ({ page }) => {
    await semear(CENARIO_RANKING);
    await page.goto('/');

    await page.getByRole('button', { name: '📊 Dashboard' }).click();
    const seletor = page.getByLabel('Jogador:');
    await expect(seletor.locator('option')).toHaveText(RANKING_ESPERADO.map(j => j.playerName));

    // Começa pelo líder do ranking.
    await expect(cartao(page, 'Partidas Jogadas')).toHaveText('3');
    await expect(cartao(page, 'Facções Diferentes')).toHaveText('3');
    await expect(cartao(page, 'Vitórias')).toHaveText('2');

    await seletor.selectOption({ label: 'Bruno' });
    await expect(cartao(page, 'Partidas Jogadas')).toHaveText('2');
    await expect(cartao(page, 'Facções Diferentes')).toHaveText('2');
    await expect(cartao(page, 'Vitórias')).toHaveText('1');

    await seletor.selectOption({ label: 'Eva' });
    await expect(cartao(page, 'Partidas Jogadas')).toHaveText('0');
    await expect(cartao(page, 'Vitórias')).toHaveText('0');
  });

  test('dados novos no backend aparecem ao voltar para a tela', async ({ page }) => {
    await semear({ jogadores: ['Ana'] });
    await page.goto('/');
    await page.getByRole('button', { name: '🏆 Ranking' }).click();
    await expect(linhas(page).locator('.nome')).toHaveText(['Ana']);

    await semear({ jogadores: ['Bruno'] });
    await page.getByRole('button', { name: '🎲 Criar Mesa' }).click();
    await page.getByRole('button', { name: '🏆 Ranking' }).click();

    await expect(linhas(page).locator('.nome')).toHaveText(['Ana', 'Bruno']);
  });
});
