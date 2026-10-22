// Скриншоти й відео для README: SCREENSHOTS=1 npx playwright test screenshots --project=desktop
import { expect, test } from '@playwright/test';
import { calmMock, freeSeats, login, openFirstSession } from './helpers';

const OUT = 'docs/screenshots';

test.skip(!process.env.SCREENSHOTS, 'лише за запитом: SCREENSHOTS=1');
test.use({ viewport: { width: 1280, height: 800 } });

test('ключові екрани', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('article').first()).toBeVisible();
  await page.screenshot({ path: `${OUT}/home.png` });

  await login(page);
  await openFirstSession(page);
  const seats = freeSeats(page);
  await seats.nth(14).click();
  await seats.nth(15).click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/seat-map.png` });

  await page.getByRole('region', { name: 'Кошик' }).getByRole('button', { name: 'Забронювати' }).click();
  await expect(page.getByText('Місця зарезервовані')).toBeVisible();
  await page.screenshot({ path: `${OUT}/checkout.png` });

  await page.getByRole('button', { name: /Оплатити/ }).click();
  await expect(page.getByRole('heading', { name: 'Квиток вже летить на пошту' })).toBeVisible({ timeout: 15_000 });
  await page.goto('/me/tickets');
  await expect(page.getByRole('article').first()).toBeVisible();
  await page.screenshot({ path: `${OUT}/tickets.png` });
});

test('адмінка', async ({ page }) => {
  await login(page, `org@shots${Date.now()}.ua`);
  await page.goto('/admin/sessions');
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('tab', { name: 'Календар' }).click();
  await page.screenshot({ path: `${OUT}/admin-calendar.png` });
  await page.getByRole('tab', { name: 'Таблиця' }).click();
  await page
    .getByRole('link', { name: /^Продажі/ })
    .first()
    .click();
  await expect(page.getByRole('img', { name: /Схема залу/ })).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/admin-sales.png` });
});

test.describe('мобільна', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  test('схема залу', async ({ page }) => {
    await openFirstSession(page);
    await freeSeats(page).nth(20).click();
    await page.screenshot({ path: `${OUT}/mobile-seat-map.png` });
  });
});

test('GIF бронювання', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    locale: 'uk-UA',
    viewport: { width: 960, height: 600 },
    recordVideo: { dir: 'test-results/video', size: { width: 960, height: 600 } },
  });
  const page = await context.newPage();
  await login(page);
  await page.goto('/');
  await calmMock(page);
  await page.waitForTimeout(800);
  await page.locator('article a[href^="/sessions/"]').first().click();
  await expect(page.locator('button.seat').first()).toBeVisible();
  await calmMock(page);
  await page.waitForTimeout(700);
  const seats = freeSeats(page);
  for (const i of [14, 15, 16]) {
    await seats.nth(i).hover();
    await page.waitForTimeout(350);
    await seats.nth(i).click();
    await page.waitForTimeout(350);
  }
  await page.waitForTimeout(600);
  await page.getByRole('region', { name: 'Кошик' }).getByRole('button', { name: 'Забронювати' }).click();
  await expect(page.getByText('Місця зарезервовані')).toBeVisible();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /Оплатити/ }).click();
  await expect(page.getByRole('heading', { name: 'Квиток вже летить на пошту' })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1800);
  const video = page.video();
  await context.close();
  await video?.saveAs(`${OUT}/booking.webm`);
});
