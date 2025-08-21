import { test, expect } from '@playwright/test';
import AES from 'crypto-js/aes';
import dotenv from 'dotenv';

dotenv.config();

test.describe('Tests with a fake answer', () => {
  test.beforeEach(async ({ page }) => {
    const cryptoKey = process.env.CRYPTO_KEY;
    if (!cryptoKey) throw new Error('CRYPTO_KEY is not defined in environment variables');
    await page.route('**/answer*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: AES.encrypt('159', cryptoKey).toString() }),
      });
    });
  });

  test('all possible ways guesser will accept names', async ({ page }) => {
    await page.goto('/game');

    await expect(page.locator('p[data-testid="guess-msg"]')).toContainText('any country');

    // await page.getByTestId('guesser').type('asdfasdfasdf');
    await page.fill("[data-cy='guesser']", "asdfasdfasdf");
    await page.keyboard.press('Enter');
    await expect(page.locator('p[data-testid="guess-msg"]')).toContainText(
      '"asdfasdfasdf" not found in database'
    );

    await page.getByTestId('guesser').type('swodon');
    await page.keyboard.press('Enter');
    await expect(page.locator('p[data-testid="guess-msg"]')).toContainText('Did you mean Sweden?');

    await page.getByTestId('guesser').type('Turkey');
    await page.keyboard.press('Enter');
    await expect(page.locator('p[data-testid="guess-msg"]')).toContainText('next guess');

    await page.getByTestId('guesser').type('saudi arubia');
    await page.keyboard.press('Enter');
    await expect(page.locator('p[data-testid="guess-msg"]')).toContainText('Saudi Arabia is warmer');

    await page.getByTestId('guesser').type('saudi arobia');
    await page.keyboard.press('Enter');
    await expect(page.locator('p[data-testid="guess-msg"]')).toContainText(
      'Already guessed Saudi Arabia'
    );

    await page.getByTestId('guesser').type('Turkey');
    await page.keyboard.press('Enter');

    await page.getByTestId('guesser').type('saudi arabia');
    await page.keyboard.press('Enter');

    await page.getByTestId('guesser').type('uae');
    await page.keyboard.press('Enter');
    await expect(page.locator('p[data-testid="guess-msg"]')).toContainText(
      'United Arab Emirates is cooler'
    );

    await page.getByTestId('guesser').type('burma');
    await page.keyboard.press('Enter');
    await expect(page.locator('p[data-testid="guess-msg"]')).toContainText('Myanmar is cooler');
  });

  test('distance unit toggle', async ({ page }) => {
  await page.goto('/game');
  // Pre-seed a couple of guesses so the closest-border UI appears
  await page.getByTestId('guesser').fill('Turkey');
  await page.keyboard.press('Enter');
  await page.getByTestId('guesser').fill('saudi arabia');
  await page.keyboard.press('Enter');

    const closestBorderText = await page.locator('[data-testid="closest-border"]').textContent();
    expect(closestBorderText || '').toContain('3,265');

    const closestBorderUnit = await page.locator('[data-testid="toggle-text"]').textContent();
    expect(closestBorderUnit || '').toContain('km');

    await page.locator('[data-cy="toggle-km-miles"]').click();

    const closestBorderTextMiles = await page
      .locator('[data-testid="closest-border"]')
      .textContent();
    expect(closestBorderTextMiles || '').toContain('2,030');

    const closestBorderUnitMiles = await page.locator('[data-testid="toggle-text"]').textContent();
    expect(closestBorderUnitMiles || '').toContain('miles');
  });

  test('toggle country list sort order', async ({ page }) => {
  await page.goto('/game');
  // Ensure list has items
  await page.getByTestId('guesser').fill('Turkey');
  await page.keyboard.press('Enter');
  await page.getByTestId('guesser').fill('saudi arabia');
  await page.keyboard.press('Enter');
    const firstItemText = await page.locator('li').first().textContent();
    expect(firstItemText || '').toContain('Saud.');

    await page.locator('[data-cy="change-sort"]').click();
    const newFirstItemText = await page.locator('li').first().textContent();
    expect(newFirstItemText || '').toContain('Türkiye');
  });

  test('winning the game', async ({ page }) => {
  await page.goto('/game');
  // Ensure change-sort button is present by adding guesses
  await page.getByTestId('guesser').fill('Turkey');
  await page.keyboard.press('Enter');
  await page.getByTestId('guesser').fill('saudi arabia');
  await page.keyboard.press('Enter');
  await page.locator('[data-cy="change-sort"]').click();

    await page.getByTestId('guesser').fill('madagascar');
    await page.keyboard.press('Enter');

    await expect(page.locator('p[data-testid="guess-msg"]')).toContainText(
      'The Mystery Country is Madagascar'
    );

  // Ensure distance sort so the answer appears first
  await page.locator('[data-cy="change-sort"]').click();
  const firstItemAfterWin = await page.locator('li').first().textContent();
  expect(firstItemAfterWin || '').toContain('Mad.');

    await expect(page.getByText('Statistics', { exact: false })).toBeVisible();

    const gamesWon = await page.locator('[data-cy="games-won"]').textContent();
    expect(gamesWon || '').toContain('1');

    const currentStreak = await page.locator('[data-cy="current-streak"]').textContent();
    expect(currentStreak || '').toContain('1');

  const todaysGuesses = await page.locator("[data-cy=\"today's-guesses\"]").textContent();
  expect(todaysGuesses || '').toContain('3');
  });
});
