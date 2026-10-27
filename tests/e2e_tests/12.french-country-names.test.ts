import countryData from '../../src/data/country_data.json';
import { expect, test } from './fixtures';

test.describe('Dominica in French', () => {
  test.beforeEach(async ({ page }) => {
    const answer = countryData.features.find(({ properties }) => properties.NAME === 'Dominica');
    expect(answer).toBeDefined();
    await page.addInitScript((country) => {
      localStorage.setItem('locale', JSON.stringify({ locale: 'fr-FR' }));
      localStorage.setItem('labels', JSON.stringify({ labelsOn: true }));
      localStorage.setItem('practice', JSON.stringify(country));
    }, answer);
    // This practice regression uses only local data and no remote services.
    await page.route(/^https?:\/\//, (route) =>
      new URL(route.request().url()).hostname === '127.0.0.1' ||
      new URL(route.request().url()).hostname === 'localhost'
        ? route.continue()
        : route.abort('blockedbyclient'),
    );
  });

  for (const guess of ['Dominique', 'Dominica']) {
    test(`accepts ${guess} and displays Dominique in French`, async ({ page }) => {
      await page.goto('/practice');
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR');
      await page.getByTestId('guesser').fill(guess);
      await page.getByTestId('guesser').press('Enter');

      await expect(page.locator('[data-cy="countries-list"]')).toContainText('Dominique');
      await expect(page.locator('p.bg-yellow-50.text-sm')).toContainText('Dominique');
      await expect(page.locator('[data-testid="guess-msg"]')).toHaveText(
        'Le pays mystère est Dominique!',
      );
    });
  }

  test('keeps rejecting Dominique as an English misspelling', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('locale', JSON.stringify({ locale: 'en-CA' }));
    });
    await page.goto('/practice');
    await page.getByTestId('guesser').fill('Dominique');
    await page.getByTestId('guesser').press('Enter');

    await expect(page.locator('[data-testid="guess-msg"]')).toHaveText(
      '"Dominique" not found in database.',
    );
    await expect(page.locator('[data-cy="countries-list"] li')).toHaveCount(0);
  });
});
