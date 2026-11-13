
import { test, expect } from './fixtures';
import crypto from 'crypto-js';
import data from '../../src/data/country_data.json';

test.use({ timezoneId: 'Europe/Prague', serviceWorkers: 'block' });
test('puzzle date counts the next win and survives refresh', async ({ page }, testInfo) => {
  const cryptoKey = testInfo.project.metadata.puzzleDateKey ?? 'puzzle-date-test-key';
  if (!cryptoKey) throw new Error('Missing public answer encryption key');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.setFixedTime(new Date('2026-09-12T21:39:42Z'));
  let stats = {
    lastWin: '2026-09-11T22:38:03Z',
    lastWinPuzzleDate: '2026-09-11',
    gamesWon: 10,
    currentStreak: 8,
    maxStreak: 8,
    usedGuesses: Array(10).fill(7),
    emojiGuesses: 'old',
  };
  const daily: any[] = [];
  const answer = data.features[0].properties.NAME;
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/account') {
      if (route.request().method() === 'PUT') stats = route.request().postDataJSON();
      return route.fulfill({ json: { stats } });
    }
    if (url.pathname === '/dailyStats') {
      daily.push(route.request().postDataJSON());
      return route.fulfill({ json: { success: true } });
    }
    if (url.pathname === '/answer') {
      expect(url.searchParams.get('day')).toBe('2026-09-12');
      return route.fulfill({
        json: { answer: crypto.AES.encrypt('0', cryptoKey).toString() },
      });
    }
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
    return route.fulfill({ status: 200, body: '', contentType: 'text/plain' });
  });
  await page.addInitScript(
    ({ stats, answer }) => {
      if (localStorage.getItem('ticket-fixture')) return;
      localStorage.setItem('ticket-fixture', 'true');
      localStorage.setItem('user', JSON.stringify({ email: 'puzzle-date@example.test' }));
      localStorage.setItem('statistics', JSON.stringify(stats));
      localStorage.setItem('guesses', JSON.stringify({ countries: [answer], day: '2026-09-12' }));
    },
    { stats, answer },
  );
  await page.goto('/game', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => stats.gamesWon).toBe(11);
  expect(stats.currentStreak).toBe(9);
  expect(stats.lastWinPuzzleDate).toBe('2026-09-12');
  await expect.poll(() => daily.some((d) => d.win && d.date === '2026-09-12')).toBe(true);
  await page.getByRole('button', { name: 'Statistics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Statistics', exact: true })).toBeVisible();
  await expect(page.getByText('2026-09-12', { exact: true })).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Statistics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Statistics', exact: true })).toBeVisible();
  expect(stats.gamesWon).toBe(11);
  expect(stats.currentStreak).toBe(9);
  expect(errors).toEqual([]);
  await page.screenshot({ animations: 'disabled', path: '/tmp/globle-solid-puzzle-preview.png' });
});
