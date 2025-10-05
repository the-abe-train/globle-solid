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

  // Helper function to decrypt today's answer
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

  // Helper function to safely open stats modal (only if not already open)
  async function openStatsModal(page: Page) {
    const isModalOpen = await page
      .locator('h2[data-i18n="StatsTitle"]')
      .isVisible()
      .catch(() => false);
    if (!isModalOpen) {
      await page.locator('button[aria-label="Statistics"]').click();
      await expect(page.locator('h2[data-i18n="StatsTitle"]')).toBeVisible();
    }
  }

  // Helper function to close stats modal (only if open)
  async function closeStatsModal(page: Page) {
    const isModalOpen = await page
      .locator('h2[data-i18n="StatsTitle"]')
      .isVisible()
      .catch(() => false);
    if (isModalOpen) {
      await page.click('body');
      // Wait for modal to close
      await page.waitForTimeout(300);
    }
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

    // Create a mutable state for the mock - this simulates the database updating
    let mockAccountStats = {
      ...initialStats,
      lastWin: dayjs(yesterday).toISOString(),
    };

    // Mock the account endpoint - make it stateful
    await page.route('**/account?email=**', async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
        // Return the account stats when fetching
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            stats: mockAccountStats,
          }),
        });
      } else if (method === 'PUT') {
        // Update the mock stats when PUT is called (simulating database update)
        const requestBody = JSON.parse(route.request().postData() || '{}');
        mockAccountStats = { ...requestBody };
        console.log('Mock database updated with:', mockAccountStats);

        // Just acknowledge the PUT request
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    // Set up initial localStorage with user email and stats
    await page.addInitScript(
      ({ email, stats }) => {
        localStorage.setItem('user', JSON.stringify({ email }));
        localStorage.setItem('statistics', JSON.stringify(stats));
      },
      { email: testEmail, stats: initialStats },
    );

    // Load the game page and WIN the game with today's actual answer
    const answerResponsePromise = page.waitForResponse((res) => res.url().includes('/answer'));
    await page.goto('/game');

    const answerResponse = await answerResponsePromise;
    const payload = await answerResponse.json();
    const answer = decryptName(payload.answer);

    // Play and win the game with today's answer
    await page.getByTestId('guesser').fill(answer);
    await page.keyboard.press('Enter');

    // Wait for stats modal to appear automatically after win
    await expect(page.locator('h2[data-i18n="StatsTitle"]')).toBeVisible();

    // Stats modal opens automatically after win - check values
    const gamesWon1 = await page.locator('td[data-cy="games-won"]').textContent();
    const currentStreak1 = await page.locator('td[data-cy="current-streak"]').textContent();

    console.log('After winning game - Games Won:', gamesWon1, 'Current Streak:', currentStreak1);

    // Verify values after winning (should be incremented)
    expect(gamesWon1).toBe('11'); // Was 10, now 11 after today's win
    expect(currentStreak1).toBe('6'); // Was 5, now 6

    // Close modal before refreshing
    await closeStatsModal(page);

    // REFRESH THE PAGE (this is where the bug occurs)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open stats modal again and check values after refresh
    await openStatsModal(page);

    const gamesWon2 = await page.locator('td[data-cy="games-won"]').textContent();
    const currentStreak2 = await page.locator('td[data-cy="current-streak"]').textContent();

    console.log('After refresh - Games Won:', gamesWon2, 'Current Streak:', currentStreak2);

    // BUG CHECK: gamesWon should NOT increase after refresh
    expect(gamesWon2).toBe('11'); // Should still be 11, not 12!
    expect(currentStreak2).toBe('6'); // Streak should still be 6

    // Close and refresh AGAIN to check for cumulative bugs
    await closeStatsModal(page);
    await page.reload();
    await page.waitForLoadState('networkidle');

    await openStatsModal(page);

    const gamesWon3 = await page.locator('td[data-cy="games-won"]').textContent();
    const currentStreak3 = await page.locator('td[data-cy="current-streak"]').textContent();

    console.log('After 2nd refresh - Games Won:', gamesWon3, 'Current Streak:', currentStreak3);

    // After multiple refreshes, values should remain stable
    expect(gamesWon3).toBe('11'); // Should STILL be 11, not 12 or 13!
    expect(currentStreak3).toBe('6'); // Should STILL be 6
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

    // Create a mutable state for the mock - this simulates the database updating
    let mockAccountStats = {
      ...initialStats,
      lastWin: dayjs(yesterday).toISOString(),
    };

    // Mock the account endpoint - make it stateful
    await page.route('**/account?email=**', async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            stats: mockAccountStats,
          }),
        });
      } else if (method === 'PUT') {
        // Update the mock stats when PUT is called (simulating database update)
        const requestBody = JSON.parse(route.request().postData() || '{}');
        mockAccountStats = { ...requestBody };
        console.log('Mock database updated with:', mockAccountStats);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    // Set up initial localStorage
    await page.addInitScript(
      ({ email, stats }) => {
        localStorage.setItem('user', JSON.stringify({ email }));
        localStorage.setItem('statistics', JSON.stringify(stats));
      },
      { email: testEmail, stats: initialStats },
    );

    // Load the game page and WIN with today's answer
    const answerResponsePromise = page.waitForResponse((res) => res.url().includes('/answer'));
    await page.goto('/game');

    const answerResponse = await answerResponsePromise;
    const payload = await answerResponse.json();
    const answer = decryptName(payload.answer);

    // Win the game
    await page.getByTestId('guesser').fill(answer);
    await page.keyboard.press('Enter');

    // Wait for stats modal to appear
    await expect(page.locator('h2[data-i18n="StatsTitle"]')).toBeVisible();

    // Check stats after winning
    const gamesWon1 = await page.locator('td[data-cy="games-won"]').textContent();
    expect(gamesWon1).toBe('16'); // Was 15, now 16
    await closeStatsModal(page);

    // Navigate to Settings page (this triggers the combineStats in onMount)
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Check stats after Settings page load
    await openStatsModal(page);
    const gamesWon2 = await page.locator('td[data-cy="games-won"]').textContent();

    console.log('After Settings navigation - Games Won:', gamesWon2);

    // BUG CHECK: gamesWon should NOT increase when visiting Settings
    expect(gamesWon2).toBe('16'); // Should stay 16, not become 17!

    // Close and navigate to Settings again
    await closeStatsModal(page);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await openStatsModal(page);
    const gamesWon3 = await page.locator('td[data-cy="games-won"]').textContent();

    console.log('After 2nd Settings navigation - Games Won:', gamesWon3);

    // Should remain stable
    expect(gamesWon3).toBe('16'); // Should STILL be 16, not 17 or 18!
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

    // Create a mutable state for the mock - this simulates the database updating
    let mockAccountStats = {
      ...initialStats,
      lastWin: dayjs(yesterday).toISOString(),
    };

    // Mock the account endpoint - make it stateful
    await page.route('**/account?email=**', async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            stats: mockAccountStats,
          }),
        });
      } else if (method === 'PUT') {
        // Update the mock stats when PUT is called (simulating database update)
        const requestBody = JSON.parse(route.request().postData() || '{}');
        mockAccountStats = { ...requestBody };
        console.log('Mock database updated with:', mockAccountStats);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.addInitScript(
      ({ email, stats }) => {
        localStorage.setItem('user', JSON.stringify({ email }));
        localStorage.setItem('statistics', JSON.stringify(stats));
      },
      { email: testEmail, stats: initialStats },
    );

    // Load game and get today's answer
    const answerResponsePromise = page.waitForResponse((res) => res.url().includes('/answer'));
    await page.goto('/game');

    const answerResponse = await answerResponsePromise;
    const payload = await answerResponse.json();
    const answer = decryptName(payload.answer);

    // Win the game
    await page.getByTestId('guesser').fill(answer);
    await page.keyboard.press('Enter');

    // Wait for stats modal
    await expect(page.locator('h2[data-i18n="StatsTitle"]')).toBeVisible();

    const currentStreak1 = await page.locator('td[data-cy="current-streak"]').textContent();
    expect(currentStreak1).toBe('13'); // Was 12, now 13 after winning

    await closeStatsModal(page);

    // Trigger sync by going to Settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await openStatsModal(page);

    const currentStreak2 = await page.locator('td[data-cy="current-streak"]').textContent();

    console.log('After sync - Current Streak:', currentStreak2);

    // BUG CHECK: streak should NOT reset to 1 or change
    expect(currentStreak2).toBe('13'); // Should stay 13
    expect(currentStreak2).not.toBe('1'); // Definitely not reset!

    // Close modal and refresh the page to test cumulative stability
    await closeStatsModal(page);
    await page.reload();
    await page.waitForLoadState('networkidle');

    await openStatsModal(page);

    const currentStreak3 = await page.locator('td[data-cy="current-streak"]').textContent();
    const gamesWon3 = await page.locator('td[data-cy="games-won"]').textContent();

    console.log('After refresh - Current Streak:', currentStreak3, 'Games Won:', gamesWon3);

    // After multiple syncs and refreshes, values should remain stable
    expect(currentStreak3).toBe('13'); // Should STILL be 13
    expect(gamesWon3).toBe('21'); // Should be 21 (was 20, now 21 after today's win)
  });
});
