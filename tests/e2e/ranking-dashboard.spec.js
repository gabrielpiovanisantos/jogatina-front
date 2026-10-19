import { test, expect } from '@playwright/test';
import { limparBanco, semear } from '../support/backend.js';
import { CENARIO_RANKING, RANKING_ESPERADO } from '../support/cenario.js';

const linhas = page => page.locator('tbody tr.linha-jogador');
const cartao = (page, rotulo) => page.locator('.card-estatistica', { hasText: rotulo }).locator('.card-valor');

test.describe('Ranking and Dashboard with backend data', () => {
  test.beforeEach(async () => {
    await limparBanco();
  });

  test('given played games when opening the ranking then lists players in the order calculated by the backend', async ({ page }) => {
    await semear(CENARIO_RANKING);
    await page.goto('/');

    await page.getByRole('button', { name: '🏆 Ranking' }).click();

    await expect(linhas(page).locator('.nome')).toHaveText(RANKING_ESPERADO.map(j => j.playerName));
    await expect(linhas(page).locator('.posicao')).toHaveText(['🥇', '🥈', '🥉', '#4', '#5']);
    await expect(linhas(page).locator('.partidas')).toHaveText(RANKING_ESPERADO.map(j => String(j.totalGames)));
  });

  test('given played games when opening the ranking then shows points and victories', async ({ page }) => {
    await semear(CENARIO_RANKING);
    await page.goto('/');

    await page.getByRole('button', { name: '🏆 Ranking' }).click();

    await expect(linhas(page).locator('.pontos')).toHaveText(RANKING_ESPERADO.map(j => String(j.totalScore)));
    await expect(linhas(page).locator('.vitorias')).toHaveText(RANKING_ESPERADO.map(j => String(j.totalVictories)));
  });

  test('given no players when opening the ranking then shows an encouraging message', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: '🏆 Ranking' }).click();

    await expect(page.getByText(/Nenhum jogador no ranking ainda/)).toBeVisible();
  });

  test('given played games when choosing a player on the dashboard then shows that player statistics', async ({ page }) => {
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

  test('given new data in the backend when returning to the screen then shows the new data', async ({ page }) => {
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
