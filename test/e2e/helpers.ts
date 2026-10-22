import { expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    __tickethubMock?: { takeSeat(id: string): void; setCompetition(on: boolean): void };
  }
}

/** Вимикає «інших глядачів» у моку, щоб тести були детермінованими. */
export async function calmMock(page: Page) {
  await page.waitForFunction(() => !!window.__tickethubMock);
  await page.evaluate(() => window.__tickethubMock!.setCompetition(false));
}

export async function login(page: Page, email = `viewer${Date.now()}@test.ua`) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill('secret123');
  await page.locator('form').getByRole('button', { name: 'Увійти' }).click();
  await expect(page).not.toHaveURL(/\/login/);
  return email;
}

/** Перший сеанс з афіші, на який ще можна купити квиток. */
export async function openFirstSession(page: Page) {
  await page.goto('/');
  await calmMock(page);
  const chip = page.locator('article a[href^="/sessions/"]').first();
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(page).toHaveURL(/\/sessions\//);
  await expect(page.locator('button.seat').first()).toBeVisible();
  await calmMock(page);
}

export function freeSeats(page: Page) {
  return page.locator('button.seat.zone-standard:not([aria-disabled])');
}
