import { test, expect, Page } from '@playwright/test';
import dayjs from 'dayjs';
import dotenv from 'dotenv';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import rawAnswerData from '../../src/data/country_data.json';

dotenv.config();
/**
 * E2E tests for the stats refresh bug where gamesWon would increment on page refresh.
 *
 * Bug Description:
 * - When a logged-in user won a game and then refreshed the page or navigated to Settings,
 *   their gamesWon count would increment by 1 each time
 * - This happened because combineStats() was being called with the same day's stats from
 *   both local storage and the database, treating them as separate games
 *
 * Fix:
 * - Updated combineStats() to detect when both stats have the same lastWin date
 * - In that case, return the database version without attempting to merge
 * - This prevents duplicate counting of the same game
 */
test.describe('Stats refresh bug - gamesWon incrementing on refresh', () => {
  const testEmail = 'test@example.com';

  function decryptName(encryptedAnsKey: string): string {
    const cryptoKey = process.env.CRYPTO_KEY;
    if (!cryptoKey) throw new Error('CRYPTO_KEY is not defined');
    const bytes = AES.decrypt(encryptedAnsKey, cryptoKey);
    const originalText = bytes.toString(Utf8);
    const answerKey = parseInt(originalText);
    expect(answerKey).toBeGreaterThanOrEqual(0);
    const feature: any = (rawAnswerData as any).features[answerKey];
    return feature.properties.NAME as string;
  }

  async function openStatsModal(page: Page) {
    const title = page.locator('h2[data-i18n="StatsTitle"]');
    if (!(await title.isVisible().catch(() => false))) {
      await page.locator('button[aria-label="Statistics"]').click();
      await expect(title).toBeVisible();
    }
  }

  async function closeStatsModal(page: Page) {
    const title = page.locator('h2[data-i18n="StatsTitle"]');
    if (await title.isVisible().catch(() => false)) {
      // Best-effort close: don't fail test flow if modal UI behavior changes.
      await page.keyboard.press('Escape').catch(() => {});
      await page
        .locator('body')
        .click({ position: { x: 5, y: 5 } })
        .catch(() => {});
      await page.waitForTimeout(150);
    }
  }

  async function setupAccountMock(page: Page, initialStats: any) {
    let mockAccountStats = {
      ...initialStats,
      lastWin: dayjs(initialStats.lastWin).toISOString(),
    };

    await page.route('**/account?email=**', async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ stats: mockAccountStats }),
        });
        return;
      }

      if (method === 'PUT') {
        const requestBody = JSON.parse(route.request().postData() || '{}');
        mockAccountStats = { ...requestBody };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
        return;
      }

      await route.continue();
    });
  }

  async function seedUserStats(page: Page, stats: any) {
    await page.addInitScript(
      ({ email, localStats }) => {
        localStorage.setItem('user', JSON.stringify({ email }));
        localStorage.setItem('statistics', JSON.stringify(localStats));
      },
      { email: testEmail, localStats: stats },
    );
  }

  async function winGameWithTodaysAnswer(page: Page) {
    const answerResponsePromise = page.waitForResponse((res) => res.url().includes('/answer'));
    await page.goto('/game', { waitUntil: 'domcontentloaded' });

    const answerResponse = await answerResponsePromise;
    const payload = await answerResponse.json();
    const answer = decryptName(payload.answer);

    await page.getByTestId('guesser').fill(answer);
    await page.keyboard.press('Enter');
    await expect(page.locator('h2[data-i18n="StatsTitle"]')).toBeVisible();
  }

  test('gamesWon should NOT increment when refreshing with logged-in user', async ({ page }) => {
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    // Initial stats - user won yesterday with a 5-game streak (today will be #11)
    const initialStats = {
      gamesWon: 10,
      lastWin: yesterday,
      currentStreak: 5,
      maxStreak: 5,
      usedGuesses: [1, 2, 1, 3, 2, 1, 2, 3, 1, 2],
      emojiGuesses: '🟩🟩',
    };

    await setupAccountMock(page, initialStats);
    await seedUserStats(page, initialStats);
    await winGameWithTodaysAnswer(page);

    // Stats modal opens automatically after win - check values
    const gamesWon1 = await page.locator('td[data-cy="games-won"]').textContent();
    const currentStreak1 = await page.locator('td[data-cy="current-streak"]').textContent();

    console.log('After winning game - Games Won:', gamesWon1, 'Current Streak:', currentStreak1);

    // Verify values after winning (should be incremented)
    expect(gamesWon1).toBe('11'); // Was 10, now 11 after today's win
    expect(currentStreak1).toBe('6'); // Was 5, now 6

    // Close modal before refreshing
    await closeStatsModal(page);

    await page.reload({ waitUntil: 'domcontentloaded' });

    // Open stats modal again and check values after refresh
    await openStatsModal(page);

    const gamesWon2 = await page.locator('td[data-cy="games-won"]').textContent();
    const currentStreak2 = await page.locator('td[data-cy="current-streak"]').textContent();

    console.log('After refresh - Games Won:', gamesWon2, 'Current Streak:', currentStreak2);

    expect(gamesWon2).toBe('11');
    expect(currentStreak2).toBe('6');
  });

  test('gamesWon should NOT increment when navigating to Settings page', async ({ page }) => {
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    const initialStats = {
      gamesWon: 15,
      lastWin: yesterday,
      currentStreak: 7,
      maxStreak: 10,
      usedGuesses: [1, 2, 1, 3, 2, 1, 2, 3, 1, 2, 1, 1, 2, 3, 1],
      emojiGuesses: '🟩🟩',
    };

    await setupAccountMock(page, initialStats);
    await seedUserStats(page, initialStats);
    await winGameWithTodaysAnswer(page);

    // Check stats after winning
    const gamesWon1 = await page.locator('td[data-cy="games-won"]').textContent();
    expect(gamesWon1).toBe('16'); // Was 15, now 16
    await closeStatsModal(page);

    await page.goto('/settings', { waitUntil: 'domcontentloaded' });

    // Check stats after Settings page load
    await openStatsModal(page);
    const gamesWon2 = await page.locator('td[data-cy="games-won"]').textContent();

    expect(gamesWon2).toBe('16');
  });

  test('streak should NOT reset when syncing with database', async ({ page }) => {
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    const initialStats = {
      gamesWon: 20,
      lastWin: yesterday,
      currentStreak: 12,
      maxStreak: 15,
      usedGuesses: new Array(20).fill(1),
      emojiGuesses: '🟩🟩',
    };

    await setupAccountMock(page, initialStats);
    await seedUserStats(page, initialStats);
    await winGameWithTodaysAnswer(page);

    const currentStreak1 = await page.locator('td[data-cy="current-streak"]').textContent();
    expect(currentStreak1).toBe('13'); // Was 12, now 13 after winning

    await closeStatsModal(page);

    await page.goto('/settings', { waitUntil: 'domcontentloaded' });

    await openStatsModal(page);

    const currentStreak2 = await page.locator('td[data-cy="current-streak"]').textContent();

    expect(currentStreak2).toBe('13');
    expect(currentStreak2).not.toBe('1');
  });
});
