import { test, expect } from '@playwright/test';
import dayjs from 'dayjs';
import AES from 'crypto-js/aes';
import dotenv from 'dotenv';

dotenv.config();

test.describe('Guesses', () => {
  test('fabricate guesses in localStorage', async ({ page }) => {
    const todaysGuessExpiration = dayjs().endOf('day').toDate();
    const guesses = {
      day: todaysGuessExpiration,
      countries: ['Canada', 'Mexico', 'Japan'],
    };

    await page.addInitScript((guessesData) => {
      localStorage.setItem('guesses', guessesData as string);
    }, JSON.stringify(guesses));

    await page.goto('/game');

    const items = page.locator('ul[data-cy="countries-list"] li');
    await expect(items).toHaveCount(3);

    const texts = await items.allTextContents();
    expect(texts.some((t) => t?.includes('Canada'))).toBeTruthy();
    expect(texts.some((t) => t?.includes('Mexico'))).toBeTruthy();
    expect(texts.some((t) => t?.includes('Japan'))).toBeTruthy();
  });

  test('guesses persist after page reload', async ({ page }) => {
    const todaysGuessExpiration = dayjs().endOf('day').toDate();
    const guesses = {
      day: todaysGuessExpiration,
      countries: ['Canada', 'Mexico', 'Japan'],
    };

    await page.addInitScript((guessesData) => {
      localStorage.setItem('guesses', guessesData as string);
    }, JSON.stringify(guesses));

    await page.goto('/game');
    await page.reload();
    const items = page.locator('ul[data-cy="countries-list"] li');
    await expect(items).toHaveCount(3);
  });

  test('checks that old guesses get reset when they expire', async ({ page }) => {
    const yesterday = dayjs().subtract(1, 'day').endOf('day').toDate();
    const guesses = {
      day: yesterday.toString(),
      countries: ['Spain', 'France', 'Germany'],
    };

    await page.addInitScript((guessesData) => {
      localStorage.setItem('guesses', guessesData as string);
    }, JSON.stringify(guesses));

    await page.goto('/game');
    const message = await page.locator('p[data-testid="guess-msg"]').textContent();
    expect(message || '').toContain('any country');
  });
});

test.describe('Maintain a streak', () => {
  test('fabricated stats, last win was yesterday', async ({ page }) => {
    const cryptoKey = process.env.CRYPTO_KEY;
    if (!cryptoKey) throw new Error('CRYPTO_KEY is not defined in environment variables');

    // Mock /answer with Madagascar (159)
    await page.route('**/answer*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: AES.encrypt('159', cryptoKey).toString() }),
      });
    });

    const yesterday = dayjs().subtract(1, 'day').toDate();
    const stats = {
      gamesWon: 4,
      lastWin: yesterday.toString(),
      currentStreak: 2,
      maxStreak: 5,
      usedGuesses: [1, 2, 3, 4],
    };

    await page.addInitScript((statsData) => {
      localStorage.setItem('statistics', statsData as string);
    }, JSON.stringify(stats));

    await page.goto('/');
    await page.locator('button[aria-label="Statistics"]').click();
    await expect(page.locator('h2[data-i18n="StatsTitle"]')).toBeVisible();
    const lastWinText1 = await page.locator('td[data-cy="last-win"]').textContent();
    const formattedLastWin = dayjs(lastWinText1 || '').format('YYYY-MM-DD');
    const formattedYesterday = dayjs(yesterday).format('YYYY-MM-DD');
    expect(formattedLastWin).toBe(formattedYesterday);
  });

  test('keep the streak going', async ({ page }) => {
    // Assumes previous route mock still active in this worker; add again to be safe
    const cryptoKey = process.env.CRYPTO_KEY;
    if (!cryptoKey) throw new Error('CRYPTO_KEY is not defined in environment variables');
    await page.route('**/answer*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: AES.encrypt('159', cryptoKey).toString() }),
      });
    });

    // Ensure the prior stats exist for this test run
    const yesterday = dayjs().subtract(1, 'day').toDate();
    const stats = {
      gamesWon: 4,
      lastWin: yesterday.toString(),
      currentStreak: 2,
      maxStreak: 5,
      usedGuesses: [1, 2, 3, 4],
    };
    await page.addInitScript((statsData) => {
      localStorage.setItem('statistics', statsData as string);
    }, JSON.stringify(stats));

    await page.goto('/game');
    await page.getByTestId('guesser').fill('madagascar');
    await page.keyboard.press('Enter');

    await expect(page.locator('h2[data-i18n="StatsTitle"]')).toBeVisible();
    const lastWinText = await page.locator('td[data-cy="last-win"]').textContent();
    const lastWinDate = dayjs(lastWinText || '').format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    expect(lastWinDate).toBe(today);

    const currentStreak = await page.locator('[data-cy="current-streak"]').textContent();
    expect(currentStreak || '').toContain('3');
  });
});

test.describe('Break a streak', () => {
  test('fabricate stats, last win 2 days ago', async ({ page }) => {
    const cryptoKey = process.env.CRYPTO_KEY;
    if (!cryptoKey) throw new Error('CRYPTO_KEY is not defined in environment variables');

    await page.route('**/answer*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: AES.encrypt('159', cryptoKey).toString() }),
      });
    });

    const twoDaysAgo = dayjs().subtract(2, 'day').toDate();
    const stats = {
      gamesWon: 4,
      lastWin: twoDaysAgo.toString(),
      currentStreak: 2,
      maxStreak: 5,
      usedGuesses: [1, 2, 3, 4],
    };

    await page.addInitScript((statsData) => {
      localStorage.setItem('statistics', statsData as string);
    }, JSON.stringify(stats));

    await page.goto('/');
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });

  test('start a new streak', async ({ page }) => {
    const cryptoKey = process.env.CRYPTO_KEY;
    if (!cryptoKey) throw new Error('CRYPTO_KEY is not defined in environment variables');
    await page.route('**/answer*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: AES.encrypt('159', cryptoKey).toString() }),
      });
    });

    await page.goto('/game');
    await page.getByTestId('guesser').fill('madagascar');
    await page.keyboard.press('Enter');

    await expect(page.locator('h2[data-i18n="StatsTitle"]')).toBeVisible();
    const lastWinText = await page.locator('td[data-cy="last-win"]').textContent();
    const lastWinDate = dayjs(lastWinText || '').format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    expect(lastWinDate).toBe(today);

    const currentStreak = await page.locator('[data-cy="current-streak"]').textContent();
    expect(currentStreak || '').toContain('1');
  });
});
