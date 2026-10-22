import { expect, test } from '@playwright/test';
import { login } from './helpers';

test('захищена сторінка веде на вхід і після логіну повертає назад', async ({ page }) => {
  await page.goto('/me/tickets');
  await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)me(%2F|\/)tickets/);

  await page.getByLabel('Email').fill(`back${Date.now()}@test.ua`);
  await page.getByLabel('Пароль', { exact: true }).fill('secret123');
  await page.locator('form').getByRole('button', { name: 'Увійти' }).click();

  await expect(page).toHaveURL('/me/tickets');
  await expect(page.getByRole('heading', { name: 'Мої квитки' })).toBeVisible();
});

test('форма входу показує помилки валідації', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('не-email');
  await page.getByLabel('Пароль', { exact: true }).fill('123');
  await page.locator('form').getByRole('button', { name: 'Увійти' }).click();

  await expect(page.getByText('Вкажіть коректний email')).toBeVisible();
  await expect(page.getByText('Пароль — щонайменше 6 символів')).toBeVisible();
  await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
});

test('реєстрація, профіль і вихід', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Ім’я').fill('Олена');
  await page.getByLabel('Email').fill(`olena${Date.now()}@test.ua`);
  await page.getByLabel('Пароль', { exact: true }).fill('secret123');
  await page.getByLabel('Повторіть пароль').fill('secret12');
  await page.getByRole('button', { name: 'Створити акаунт' }).click();
  await expect(page.getByText('Паролі не збігаються')).toBeVisible();

  await page.getByLabel('Повторіть пароль').fill('secret123');
  await page.getByRole('button', { name: 'Створити акаунт' }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/profile');
  await expect(page.getByText('Олена', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Вийти' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/me/tickets');
  await expect(page).toHaveURL(/\/login/);
});

test('глядач не потрапляє в адмінку', async ({ page }) => {
  await login(page);
  await page.goto('/admin/sessions');
  await expect(page).toHaveURL('/');
});
