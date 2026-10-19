import { test, expect } from '@playwright/test';
import { limparBanco, semear } from '../support/backend.js';

test.describe('Finish game with backend players', () => {
  test.beforeEach(async () => {
    await limparBanco();
  });

  test('given registered players when finishing a game from the navbar then it shows up in the ranking', async ({ page }) => {
    await semear({ jogadores: ['Ana', 'Bruno'] });
    await page.goto('/');

    await page.getByRole('button', { name: '📝 Registrar Partida' }).click();

    await page.getByLabel('Jogador 1').selectOption({ label: 'Ana' });
    await page.getByRole('combobox').nth(1).selectOption('Marquise de Cat');
    await page.getByRole('spinbutton').first().fill('30');
    await page.getByRole('checkbox').first().check();

    await page.getByRole('button', { name: '+ Adicionar Jogador' }).click();
    await page.getByLabel('Jogador 2').selectOption({ label: 'Bruno' });
    await page.getByRole('combobox').nth(3).selectOption('Vagabond');
    await page.getByRole('spinbutton').nth(1).fill('20');

    const alerta = page.waitForEvent('dialog');
    await page.getByRole('button', { name: 'Salvar Partida' }).click();
    const dialogo = await alerta;
    expect(dialogo.message()).toContain('Partida registrada com sucesso');
    await dialogo.accept();

    await page.getByRole('button', { name: '🏆 Ranking' }).click();
    await expect(page.locator('tbody tr.linha-jogador .nome')).toHaveText(['Ana', 'Bruno']);
    await expect(page.locator('tbody tr.linha-jogador .vitorias')).toHaveText(['1', '0']);
  });

  test('given no players when opening Registrar Partida then asks to organize a table first', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: '📝 Registrar Partida' }).click();

    await expect(page.getByText(/Nenhum jogador cadastrado ainda/)).toBeVisible();
  });
});
