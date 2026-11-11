import { afterEach, expect, test, vi } from 'vitest';
import dayjs from 'dayjs';
import { addGameToStats, combineStats } from '../../src/util/stats';
import { lastWinPuzzleDate } from '../../src/util/statsDate';
import { getCountry } from '../../src/util/data';
const answer = getCountry('Ghana');

afterEach(() => vi.useRealTimers());

function previous(): Stats {
  return {
    lastWin: '2026-09-12T00:38:03+02:00',
    lastWinPuzzleDate: '2026-09-11',
    gamesWon: 10,
    currentStreak: 8,
    maxStreak: 8,
    usedGuesses: Array(10).fill(7),
    emojiGuesses: 'old',
  };
}

function win(stats: Stats, date: string) {
  return addGameToStats(stats, [answer], answer, date);
}

test('two puzzle wins completed on the same calendar day both count', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-12T21:39:42Z'));
  const result = win(previous(), '2026-09-12');
  expect(result.gamesWon).toBe(11);
  expect(result.currentStreak).toBe(9);
  expect(result.lastWinPuzzleDate).toBe('2026-09-12');
  const merged = combineStats(result, previous());
  expect(merged.gamesWon).toBe(11);
  expect(merged.lastWinPuzzleDate).toBe('2026-09-12');
});

test('same puzzle completed on different dates stays a single win', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-13T01:00:00Z'));
  const stats = { ...previous(), usedGuesses: [...Array(9).fill(7), 1] };
  expect(win(stats, '2026-09-11').gamesWon).toBe(10);
  const later = { ...stats, lastWin: new Date().toISOString() };
  expect(combineStats(later, stats).gamesWon).toBe(10);
});

test('streak uses adjacent puzzle dates even when completion is delayed', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-14T01:00:00Z'));
  expect(win(previous(), '2026-09-12').currentStreak).toBe(9);
  expect(win(previous(), '2026-09-13').currentStreak).toBe(1);
  expect(win(previous(), '2026-09-10')).toEqual(previous());
});

test('legacy absent, null and invalid dates retain timestamp fallback', () => {
  const stats = previous();
  const expected = dayjs(stats.lastWin).format('YYYY-MM-DD');
  for (const value of [undefined, null, '2026-02-30', 'invalid']) {
    expect(lastWinPuzzleDate({ ...stats, lastWinPuzzleDate: value })).toBe(expected);
  }
});

test('puzzle date survives a different viewing timezone or completion date', () => {
  expect(lastWinPuzzleDate(previous())).toBe('2026-09-11');
  expect(lastWinPuzzleDate({ ...previous(), lastWin: '2026-09-13T01:00:00Z' })).toBe('2026-09-11');
});

test('sync retains puzzle date when an older client omitted the field', () => {
  const local = previous();
  const account = { ...local, lastWin: '2026-09-11T12:00:00Z', lastWinPuzzleDate: null };
  expect(combineStats(local, account).lastWinPuzzleDate).toBe('2026-09-11');
});
