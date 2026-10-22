import { expect, test } from '@playwright/test';
import { login } from './helpers';

function inDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

test('організатор створює сеанс-чернетку, публікує й бачить продажі', async ({ page }) => {
  await login(page, `org@test${Date.now()}.ua`);
  await page.goto('/admin/sessions');
  await expect(page.getByRole('heading', { name: 'Розклад сеансів' })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();

  // о 07:00 зал вільний: згенерований розклад починається з 10:00
  await page.getByRole('button', { name: 'Новий сеанс' }).click();
  const dialog = page.getByRole('dialog', { name: 'Новий сеанс' });
  await dialog.getByLabel('Фільм').selectOption({ label: 'Кіт, що вмів літати · 1 год 32 хв' });
  await dialog.getByLabel('Дата').fill(inDays(3));
  await dialog.getByLabel('Початок').fill('07:00');
  await dialog.getByRole('button', { name: 'Створити' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'створено' })).toBeVisible();

  // сеанс через 3 дні може потрапити на наступний тиждень (тиждень — з понеділка)
  const weekday = (new Date().getDay() + 6) % 7;
  if (weekday + 3 > 6) await page.getByRole('button', { name: 'Наступний тиждень' }).click();
  const row = page.getByRole('row').filter({ hasText: '07:00' }).filter({ hasText: 'Кіт, що вмів літати' });
  await expect(row).toContainText('Чернетка');
  await row.getByRole('button', { name: /^Опублікувати/ }).click();
  await expect(row).toContainText('В афіші');

  await row.getByRole('link', { name: /^Продажі/ }).click();
  await expect(page).toHaveURL(/\/admin\/sessions\/.+\/sales$/);
  await expect(page.getByRole('term').filter({ hasText: 'Продано' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Схема залу/ })).toBeVisible();
});

test('перетин сеансів у залі не дає зберегти', async ({ page }) => {
  await login(page, `org@test${Date.now()}.ua`);
  await page.goto('/admin/sessions');
  const dialog = page.getByRole('dialog', { name: 'Новий сеанс' });

  // ранковий сеанс о 07:00 — до початку згенерованого розкладу
  const create = async (time: string) => {
    await page.getByRole('button', { name: 'Новий сеанс' }).click();
    await dialog.getByLabel('Фільм').selectOption({ label: 'Кіт, що вмів літати · 1 год 32 хв' });
    await dialog.getByLabel('Зал').selectOption({ label: 'IMAX · IMAX' });
    await dialog.getByLabel('Дата').fill(inDays(5));
    await dialog.getByLabel('Початок').fill(time);
    await dialog.getByRole('button', { name: 'Створити' }).click();
  };

  await create('07:00');
  await expect(dialog).toBeHidden();
  await create('07:30');
  await expect(dialog.getByRole('alert')).toContainText('Зал зайнятий');
});

test('сканер: невідомий код — рожевий екран «не знайдено»', async ({ page }) => {
  await login(page, `org@test${Date.now()}.ua`);
  await page.goto('/admin/scan');
  await page.getByLabel('Код квитка').fill('TH-NOPE0000-101');
  await page.getByRole('button', { name: 'Перевірити' }).click();
  await expect(page.getByRole('alert')).toContainText('Квиток не знайдено');
  await page.getByRole('button', { name: 'Продовжити сканування' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('complementary', { name: 'Останні сканування' })).toContainText('Квиток не знайдено');
});

test('адміністратор налаштовує схему залу', async ({ page }) => {
  await login(page, `admin@test${Date.now()}.ua`);
  await page.goto('/admin/halls');
  await expect(page.getByRole('tab', { name: 'Зал 1' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('slider', { name: 'Ряди' }).fill('12');
  await expect(page.getByText(/^\d+ місць/).or(page.getByText(/місць ·/))).toBeVisible();
  await page.getByRole('button', { name: 'Зберегти схему' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'збережено' })).toBeVisible();
});

test('організатор не бачить розділ «Зали»', async ({ page }) => {
  await login(page, `org@test${Date.now()}.ua`);
  await page.goto('/admin/halls');
  await expect(page).toHaveURL('/');
});
