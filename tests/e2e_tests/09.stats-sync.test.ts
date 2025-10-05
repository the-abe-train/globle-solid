import { test, expect } from '@playwright/test';
import dayjs from 'dayjs';

test.describe('Stats Sync with Database', () => {
  const testEmail = 'test@example.com';

  // These are the fake stats that should be manually added to the database
  // for the test@example.com account
  const databaseStats = {
    gamesWon: 42,
    lastWin: '2025-10-04', // Yesterday
    currentStreak: 7,
    maxStreak: 15,
    usedGuesses: [
      1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 3, 1, 2, 1, 2, 3, 1, 2, 1, 2, 3, 1, 2, 1, 2, 3, 1, 2, 1, 2, 3,
      1, 2, 1, 2, 3, 1, 2, 1, 2, 3, 1,
    ], // 42 games
    emojiGuesses: '🟩🟩🟥',
  };

  test('stats should sync from database after signing in', async ({ page }) => {
    // Block PUT requests to prevent updating the database
    await page.route('**/account?email=**', async (route) => {
      const method = route.request().method();
      if (method === 'PUT') {
        // Block PUT requests - return success without updating database
        console.log('Blocking PUT request to prevent database update');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        // Allow GET requests to pass through to real database
        await route.continue();
      }
    });

    // Start with empty local stats
    await page.addInitScript(() => {
      localStorage.setItem(
        'statistics',
        JSON.stringify({
          gamesWon: 0,
          lastWin: '',
          currentStreak: 0,
          maxStreak: 0,
          usedGuesses: [],
          emojiGuesses: '',
        }),
      );
    });

    // Go to the game page
    await page.goto('/game');
    await page.waitForLoadState('networkidle');

    // Open stats modal to verify starting state (empty)
    await page.getByRole('button', { name: 'Statistics' }).click();

    await expect(page.locator('h2[data-i18n="StatsTitle"]')).toBeVisible();

    const gamesWonBefore = await page.locator('td[data-cy="games-won"]').textContent();
    const currentStreakBefore = await page.locator('td[data-cy="current-streak"]').textContent();
    const maxStreakBefore = await page.locator('td[data-cy="max-streak"]').textContent();

    console.log('Before signing in:');
    console.log('  Games Won:', gamesWonBefore);
    console.log('  Current Streak:', currentStreakBefore);
    console.log('  Max Streak:', maxStreakBefore);

    // Verify initial stats are empty
    expect(gamesWonBefore).toBe('0');
    expect(currentStreakBefore).toBe('0');
    expect(maxStreakBefore).toBe('0');

    // Close stats modal
    await page.click('body');
    await page.waitForTimeout(300);

    // Now simulate signing in by setting the user in localStorage
    // and navigating to Settings (which triggers the sync)
    await page.evaluate((email) => {
      localStorage.setItem('user', JSON.stringify({ email }));
    }, testEmail);

    // Navigate to Settings page to trigger stats sync
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Wait for the account endpoint to be called (sync happens in onMount)
    await page.waitForTimeout(1000); // Give time for the fetch to complete

    // Open stats modal to check synced values
    await page.getByRole('button', { name: 'Statistics' }).click();
    await expect(page.locator('h2[data-i18n="StatsTitle"]')).toBeVisible();

    const gamesWonAfter = await page.locator('td[data-cy="games-won"]').textContent();
    const currentStreakAfter = await page.locator('td[data-cy="current-streak"]').textContent();
    const maxStreakAfter = await page.locator('td[data-cy="max-streak"]').textContent();

    console.log('After signing in:');
    console.log('  Games Won:', gamesWonAfter);
    console.log('  Current Streak:', currentStreakAfter);
    console.log('  Max Streak:', maxStreakAfter);

    // Verify stats now match the database values
    expect(gamesWonAfter).toBe(databaseStats.gamesWon.toString());
    expect(currentStreakAfter).toBe(databaseStats.currentStreak.toString());
    expect(maxStreakAfter).toBe(databaseStats.maxStreak.toString());

    // Close modal
    await page.click('body');
    await page.waitForTimeout(300);

    // Refresh the page to ensure stats persist
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check stats again after refresh
    await page.getByRole('button', { name: 'Statistics' }).click();
    await expect(page.locator('h2[data-i18n="StatsTitle"]')).toBeVisible();

    const gamesWonAfterRefresh = await page.locator('td[data-cy="games-won"]').textContent();
    const currentStreakAfterRefresh = await page
      .locator('td[data-cy="current-streak"]')
      .textContent();
    const maxStreakAfterRefresh = await page.locator('td[data-cy="max-streak"]').textContent();

    console.log('After refresh:');
    console.log('  Games Won:', gamesWonAfterRefresh);
    console.log('  Current Streak:', currentStreakAfterRefresh);
    console.log('  Max Streak:', maxStreakAfterRefresh);

    // Verify stats still match after refresh
    expect(gamesWonAfterRefresh).toBe(databaseStats.gamesWon.toString());
    expect(currentStreakAfterRefresh).toBe(databaseStats.currentStreak.toString());
    expect(maxStreakAfterRefresh).toBe(databaseStats.maxStreak.toString());
  });

  test('stats should merge correctly when local has games and user signs in', async ({ page }) => {
    // Block PUT requests to prevent updating the database
    await page.route('**/account?email=**', async (route) => {
      const method = route.request().method();
      if (method === 'PUT') {
        // Block PUT requests - return success without updating database
        console.log('Blocking PUT request to prevent database update');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        // Allow GET requests to pass through to real database
        await route.continue();
      }
    });

    // Start with some local stats (different from database)
    const localStats = {
      gamesWon: 5,
      lastWin: dayjs().subtract(3, 'days').format('YYYY-MM-DD'),
      currentStreak: 2,
      maxStreak: 3,
      usedGuesses: [1, 2, 1, 3, 2],
      emojiGuesses: '🟩🟩',
    };

    await page.addInitScript((stats) => {
      localStorage.setItem('statistics', JSON.stringify(stats));
    }, localStats);

    // Go to the game page
    await page.goto('/game');
    await page.waitForLoadState('networkidle');

    // Open stats modal to verify starting state (local stats)
    await page.getByRole('button', { name: 'Statistics' }).click();
    await expect(page.locator('h2[data-i18n="StatsTitle"]')).toBeVisible();

    const gamesWonBefore = await page.locator('td[data-cy="games-won"]').textContent();
    const currentStreakBefore = await page.locator('td[data-cy="current-streak"]').textContent();
    const maxStreakBefore = await page.locator('td[data-cy="max-streak"]').textContent();

    console.log('Before signing in (local stats):');
    console.log('  Games Won:', gamesWonBefore);
    console.log('  Current Streak:', currentStreakBefore);
    console.log('  Max Streak:', maxStreakBefore);

    // Verify initial local stats
    expect(gamesWonBefore).toBe('5');
    expect(currentStreakBefore).toBe('2');
    expect(maxStreakBefore).toBe('3');

    // Close stats modal
    await page.click('body');
    await page.waitForTimeout(300);

    // Sign in
    await page.evaluate((email) => {
      localStorage.setItem('user', JSON.stringify({ email }));
    }, testEmail);

    // Navigate to Settings to trigger sync
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open stats modal to check merged values
    await page.getByRole('button', { name: 'Statistics' }).click();
    await expect(page.locator('h2[data-i18n="StatsTitle"]')).toBeVisible();

    const gamesWonAfter = await page.locator('td[data-cy="games-won"]').textContent();
    const currentStreakAfter = await page.locator('td[data-cy="current-streak"]').textContent();
    const maxStreakAfter = await page.locator('td[data-cy="max-streak"]').textContent();

    console.log('After signing in (merged stats):');
    console.log('  Games Won:', gamesWonAfter);
    console.log('  Current Streak:', currentStreakAfter);
    console.log('  Max Streak:', maxStreakAfter);

    // After merging:
    // - gamesWon should be from the account with more games (database: 42 > local: 5)
    expect(gamesWonAfter).toBe(databaseStats.gamesWon.toString());

    // - currentStreak should be from most recent date (database: Oct 4 is more recent than 3 days ago)
    expect(currentStreakAfter).toBe(databaseStats.currentStreak.toString());

    // - maxStreak should be the highest value (database: 15 > local: 3)
    expect(maxStreakAfter).toBe(databaseStats.maxStreak.toString());
  });
});
