import { expect, test } from '@playwright/test';
import { calmMock, freeSeats, login, openFirstSession } from './helpers';

test('повний шлях: афіша → сеанс → 2 місця → вхід → оплата → квиток', async ({ page }) => {
  await openFirstSession(page);

  const seats = freeSeats(page);
  const first = seats.nth(0);
  const second = seats.nth(1);
  const firstLabel = await first.getAttribute('aria-label');
  await first.click();
  await second.click();
  await expect(first).toHaveAttribute('aria-pressed', 'true');

  const cart = page.getByRole('region', { name: 'Кошик' });
  await expect(cart).toContainText('2 місця');
  await expect(cart.getByRole('list', { name: 'Вибрані місця' }).getByRole('listitem')).toHaveCount(2);

  // гість → вхід → повернення на той самий сеанс з тими самими місцями
  await cart.getByRole('button', { name: 'Забронювати' }).click();
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await page.getByLabel('Email').fill(`buyer${Date.now()}@test.ua`);
  await page.getByLabel('Пароль', { exact: true }).fill('secret123');
  await page.locator('form').getByRole('button', { name: 'Увійти' }).click();
  await expect(page).toHaveURL(/\/sessions\//);
  await calmMock(page);
  await expect(page.getByRole('button', { name: firstLabel! })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('region', { name: 'Кошик' }).getByRole('button', { name: 'Забронювати' }).click();

  // оформлення
  await expect(page).toHaveURL(/\/checkout\/[^/]+$/);
  await expect(page.getByRole('heading', { name: 'Оформлення' })).toBeVisible();
  await expect(page.getByText('Місця зарезервовані')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Місця' }).getByRole('listitem')).toHaveCount(2);
  await page.getByRole('button', { name: /Оплатити/ }).click();

  // повернення від провайдера, polling до PAID
  await expect(page).toHaveURL(/\/result$/);
  await expect(page.getByRole('heading', { name: 'Квиток вже летить на пошту' })).toBeVisible({ timeout: 15_000 });

  await page.getByRole('link', { name: 'Мої квитки' }).first().click();
  await expect(page).toHaveURL('/me/tickets');
  const tickets = page.getByRole('article', { name: /^Квиток:/ });
  await expect(tickets.first()).toBeVisible();
  await expect(page.getByRole('img', { name: /QR-код квитка TH-/ }).first()).toBeVisible();
});

test('409: місце перехопили перед бронюванням — воно знімається з кошика', async ({ page }) => {
  await login(page);
  await openFirstSession(page);

  const seats = freeSeats(page);
  const lostId = (await seats.nth(0).getAttribute('data-seat-id'))!;
  await seats.nth(0).click();
  await seats.nth(1).click();
  const cart = page.getByRole('region', { name: 'Кошик' });
  await expect(cart).toContainText('2 місця');

  // інший глядач купує перше місце
  await page.evaluate((id) => window.__tickethubMock!.takeSeat(id), lostId);
  await cart.getByRole('button', { name: 'Забронювати' }).click();

  await expect(page.getByRole('alert').filter({ hasText: 'Хтось встиг раніше' })).toBeVisible();
  await expect(page).toHaveURL(/\/sessions\//);
  await expect(cart).toContainText('1 місце');
  await expect(page.locator(`[data-seat-id="${lostId}"]`)).toHaveAttribute('aria-disabled', 'true');

  // решта вибору збереглась — можна бронювати далі
  await cart.getByRole('button', { name: 'Забронювати' }).click();
  await expect(page).toHaveURL(/\/checkout\//);
});

test('ліміт — не більше 8 місць за замовлення', async ({ page }) => {
  await openFirstSession(page);
  const seats = freeSeats(page);
  for (let i = 0; i < 9; i++) await seats.nth(i).click();
  await expect(page.getByRole('status').filter({ hasText: 'не більше 8 місць' })).toBeVisible();
  await expect(page.locator('button.seat[aria-pressed="true"]')).toHaveCount(8);
});

test('вибір місць переживає перезавантаження сторінки', async ({ page }) => {
  await openFirstSession(page);
  const seat = freeSeats(page).first();
  const id = await seat.getAttribute('data-seat-id');
  await seat.click();
  await page.reload();
  await calmMock(page);
  await expect(page.locator(`[data-seat-id="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
});

test('клавіатура: стрілки й пробіл обирають місце', async ({ page, isMobile }) => {
  test.skip(isMobile, 'клавіатурний сценарій — для десктопу');
  await openFirstSession(page);
  const focusable = page.locator('button.seat[tabindex="0"]');
  await focusable.focus();
  await page.keyboard.press('ArrowRight');
  const active = page.locator('button.seat:focus');
  const id = await active.getAttribute('data-seat-id');
  if ((await active.getAttribute('aria-disabled')) === 'true') return; // зайняте — нічого не перевіряємо
  await page.keyboard.press('Space');
  await expect(page.locator(`[data-seat-id="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
});

test.afterEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear()).catch(() => {});
});
