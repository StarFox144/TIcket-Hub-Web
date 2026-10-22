import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { login, openFirstSession } from './helpers';

/** WCAG 2.1 AA: контраст, ролі, назви, фокус. */
async function audit(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const report = violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(' '))
        .join('\n  ')}`,
  );
  expect(report, report.join('\n')).toEqual([]);
}

test('афіша', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('article').first()).toBeVisible();
  await audit(page);
});

test('вибір місць', async ({ page }) => {
  await openFirstSession(page);
  await audit(page);
});

test('вхід', async ({ page }) => {
  await page.goto('/login');
  await audit(page);
});

test('мої квитки', async ({ page }) => {
  await login(page);
  await page.goto('/me/tickets');
  await expect(page.getByRole('article').first()).toBeVisible();
  await audit(page);
});
