import { test, expect } from '@playwright/test';
import { limparBanco } from '../support/backend.js';

const ANO_QUE_VEM = new Date().getFullYear() + 1;
const DATA_PARTIDA = `${ANO_QUE_VEM}-12-25`;

async function criarMesa(page, quantidade) {
  await page.goto('/');
  await page.getByLabel('Data da Partida:').fill(DATA_PARTIDA);
  await page.getByLabel('Qual Jogo:').selectOption('Root');
  await page.getByLabel('Quantidade de Pessoas:').fill(String(quantidade));
  await page.getByRole('button', { name: 'Continuar' }).click();
}

async function adicionarJogadores(page, nomes) {
  const campo = page.getByPlaceholder('Nome do jogador...');
  for (const nome of nomes) {
    await campo.fill(nome);
    await campo.press('Enter');
  }
}

test.describe('Criar mesa e organizar jogadores', () => {
  test.beforeEach(() => limparBanco());

  test('fluxo completo: criar mesa → adicionar jogadores → mesas organizadas pelo backend', async ({ page }) => {
    await criarMesa(page, 5);

    await expect(page.getByRole('heading', { name: 'Resumo da Mesa' })).toBeVisible();
    await expect(page.locator('.resumo-valor').nth(1)).toHaveText('Root');
    await expect(page.locator('.resumo-valor').nth(2)).toHaveText('5');
    await page.getByRole('button', { name: 'Confirmar e Continuar' }).click();

    await expect(page.locator('.info-mesa')).toContainText(DATA_PARTIDA);
    await expect(page.locator('.info-mesa')).toContainText('Root');

    // Autocomplete: digita parte do nome e escolhe a sugestão pelo teclado.
    const campo = page.getByPlaceholder('Nome do jogador...');
    await campo.fill('jo');
    await expect(page.locator('.item-sugestao')).toHaveText(['João']);
    await campo.press('ArrowDown');
    await campo.press('Enter');
    await expect(campo).toHaveValue('João');
    await campo.press('Enter');

    await adicionarJogadores(page, ['Ana', 'Bruno', 'Carla', 'Diego']);
    await expect(page.getByText('Total de confirmados: 5')).toBeVisible();

    const resposta = page.waitForResponse('**/api/setup/organize');
    await page.getByRole('button', { name: /Organizar Mesas/ }).click();
    expect((await resposta).status()).toBe(200);

    await expect(page.getByRole('heading', { name: 'Mesas Organizadas 🎲' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3 })).toHaveText(['🎮 Mesa 1 (5 jogadores)']);
  });

  test('reorganiza depois de remover um jogador', async ({ page }) => {
    await criarMesa(page, 10);
    await page.getByRole('button', { name: 'Confirmar e Continuar' }).click();
    const nomes = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eva', 'Fábio', 'Gil', 'Hugo', 'Iris', 'Júlia'];
    await adicionarJogadores(page, nomes);

    await page.getByRole('button', { name: /Organizar Mesas/ }).click();
    await expect(page.getByRole('heading', { level: 3 }))
      .toHaveText(['🎮 Mesa 1 (5 jogadores)', '🎮 Mesa 2 (5 jogadores)']);

    await page.getByRole('button', { name: '← Reorganizar' }).click();
    await page.locator('.item-jogador', { hasText: 'Júlia' }).getByRole('button', { name: 'Remover' }).click();
    await expect(page.getByText('Total de confirmados: 9')).toBeVisible();

    await page.getByRole('button', { name: /Organizar Mesas/ }).click();
    await expect(page.getByRole('heading', { level: 3 }))
      .toHaveText(['🎮 Mesa 1 (5 jogadores)', '🎮 Mesa 2 (4 jogadores)']);
    await expect(page.getByText('Júlia')).toHaveCount(0);
  });

  test('não permite organizar com menos de 3 jogadores', async ({ page }) => {
    await criarMesa(page, 2);
    await page.getByRole('button', { name: 'Confirmar e Continuar' }).click();
    await adicionarJogadores(page, ['Ana', 'Bruno']);

    await expect(page.getByRole('button', { name: /Organizar Mesas/ })).toBeDisabled();
  });

  test('mostra erro amigável quando o backend está fora do ar', async ({ page }) => {
    await page.route('**/api/setup/organize', route => route.abort('connectionrefused'));
    await criarMesa(page, 3);
    await page.getByRole('button', { name: 'Confirmar e Continuar' }).click();
    await adicionarJogadores(page, ['Ana', 'Bruno', 'Carla']);

    await page.getByRole('button', { name: /Organizar Mesas/ }).click();

    await expect(page.getByText(/Falha ao conectar com o servidor/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Organizar Mesas/ })).toBeEnabled();
  });

  // O contexto roda em America/Sao_Paulo (UTC-3): datas tratadas como UTC
  // aparecem com um dia de diferença.
  test('resumo mostra a data escolhida no fuso do usuário', async ({ page }) => {
    await criarMesa(page, 4);

    await expect(page.locator('.resumo-valor').first()).toHaveText(`25/12/${ANO_QUE_VEM}`);
  });

  test('data mínima é o dia de hoje no fuso do usuário, mesmo à noite', async ({ page }) => {
    // 22h30 em Brasília já é o dia seguinte em UTC.
    await page.clock.setFixedTime(new Date('2026-12-24T22:30:00-03:00'));
    await page.goto('/');

    await expect(page.getByLabel('Data da Partida:')).toHaveAttribute('min', '2026-12-24');
  });
});
