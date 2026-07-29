import { expect, test } from '@playwright/test';

const useStoredFrenchLocale = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('locale', JSON.stringify({ locale: 'fr-FR' }));
  });
};

test.describe('Translation initialization', () => {
  test('direct-loads settings in the stored locale before the first render', async ({ page }) => {
    await useStoredFrenchLocale(page);
    await page.goto('/settings');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR');
    await expect(page.locator('h2[data-i18n="SettingsTitle"]')).toHaveText('Paramètres');
    await expect(page.locator('label[for="Language"]')).toContainText('Langue');
    await expect(page.locator('label[for="Colours"]')).toContainText('Les couleurs');

    await page.getByRole('button', { name: 'Statistics' }).click();
    await expect(page.getByText('Dernière victoire', { exact: true })).toBeVisible();
  });

  test('direct-loads the game in the stored locale before the first render', async ({ page }) => {
    await useStoredFrenchLocale(page);
    await page.goto('/game');

    await expect(page.getByTestId('guesser')).toHaveAttribute(
      'placeholder',
      "Entrez le nom d'un pays ici.",
    );
    await expect(page.locator('[data-testid="guess-msg"]')).toContainText(
      "Entrez le nom de n'importe quel pays",
    );
  });
});
