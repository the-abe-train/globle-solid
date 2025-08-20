import { test, expect } from '@playwright/test';

test.describe('Navigation tests', () => {
  test('should display header and footer', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'GLOBLE' })).toBeVisible();
    await expect(page.locator('a[href="https://trainwrecklabs.com"]')).toHaveText('by Trainwreck Labs');
  });

  test('Visits every nav link', async ({ page }) => {
    // Home
    await page.goto('/');
    await expect(page).toHaveTitle('Globle');
    await expect(page.getByRole('heading', { level: 2, name: 'How to Play' })).toBeVisible();

    // Settings
    await page.getByTestId('settings-link').click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator('h2[data-i18n="SettingsTitle"]')).toHaveText('Settings');

    // Practice
    await page.getByTestId('practice-link').click();
    await expect(page).toHaveURL(/\/practice/);
    await expect(page.getByText('playing a practice game', { exact: false })).toBeVisible();

    // Game
    await page.getByTestId('game-link').click();
    await expect(page).toHaveURL(/\/game/);
    await expect(page.getByTestId('guesser')).toBeVisible();
    await expect(page.getByText('first guess', { exact: false })).toBeVisible();

    // FAQ
    await page.getByTestId('faq-footer-link').click();
    await expect(page).toHaveURL(/\/faq/);
    await expect(page.getByRole('heading', { level: 2, name: /faq/i })).toBeVisible();

    // Privacy Policy
    await page.locator('[data-i18n="q9"]').click();
    await page.locator('a[href="/privacy-policy"]').click();
    await expect(page).toHaveURL(/\/privacy-policy/);
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible();
  });
});
