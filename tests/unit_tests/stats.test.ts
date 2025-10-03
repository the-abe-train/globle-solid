// sum.test.js
import { expect, test } from 'vitest';
import { addGameToStats, combineStats } from '../../src/util/stats';
import { getCountry } from '../../src/util/data';
import dayjs from 'dayjs';

test('sync devices', () => {
  const yesterdaysStats: Stats = {
    lastWin: '2020-01-01',
    currentStreak: 1,
    emojiGuesses: '🇺🇸',
    gamesWon: 1,
    maxStreak: 1,
    usedGuesses: [1],
  };
  const newDeviceStats: Stats = {
    lastWin: '2020-01-02',
    currentStreak: 2,
    emojiGuesses: '🇺🇸🇺🇸',
    gamesWon: 2,
    maxStreak: 2,
    usedGuesses: [1, 2],
  };
  const combinedStats = combineStats(yesterdaysStats, newDeviceStats);
  expect(combinedStats).toEqual({
    lastWin: '2020-01-02',
    currentStreak: 2,
    emojiGuesses: '🇺🇸🇺🇸',
    gamesWon: 2,
    maxStreak: 2,
    usedGuesses: [1, 2],
  });
});

test('big streak continues', () => {
  const stats1: Stats = {
    lastWin: '2020-01-01',
    currentStreak: 5,
    emojiGuesses: '🇺🇸',
    gamesWon: 5,
    maxStreak: 5,
    usedGuesses: [1, 1, 1, 1, 1],
  };
  const stats2: Stats = {
    lastWin: '2020-01-02',
    currentStreak: 1,
    emojiGuesses: '🇺🇸🇺🇸',
    gamesWon: 1,
    maxStreak: 1,
    usedGuesses: [2],
  };
  const combinedStats = combineStats(stats1, stats2);
  expect(combinedStats).toEqual({
    lastWin: '2020-01-02',
    currentStreak: 6,
    emojiGuesses: '🇺🇸🇺🇸',
    gamesWon: 6,
    maxStreak: 6,
    usedGuesses: [1, 1, 1, 1, 1, 2],
  });
});

test('streak is broken', () => {
  const stats1: Stats = {
    lastWin: '2020-01-01',
    currentStreak: 5,
    emojiGuesses: '🇺🇸',
    gamesWon: 5,
    maxStreak: 5,
    usedGuesses: [1, 1, 1, 1, 1],
  };
  const stats2: Stats = {
    lastWin: '2020-01-03',
    currentStreak: 1,
    emojiGuesses: '🇺🇸🇺🇸',
    gamesWon: 1,
    maxStreak: 1,
    usedGuesses: [2],
  };
  const combinedStats = combineStats(stats1, stats2);
  expect(combinedStats).toEqual({
    lastWin: '2020-01-03',
    currentStreak: 1,
    emojiGuesses: '🇺🇸🇺🇸',
    gamesWon: 5, // wrong, but best with the logic we have
    maxStreak: 5,
    usedGuesses: [1, 1, 1, 1, 1],
  });
});

test('duplicate game', () => {
  const stats1: Stats = {
    lastWin: '2023-08-25',
    currentStreak: 5,
    emojiGuesses: '🇺🇸',
    gamesWon: 16,
    maxStreak: 5,
    usedGuesses: [...new Array(16).fill(1)],
  };
  const stats2: Stats = {
    lastWin: '2023-08-25',
    currentStreak: 5,
    emojiGuesses: '🇺🇸',
    gamesWon: 16,
    maxStreak: 5,
    usedGuesses: [...new Array(16).fill(1)],
  };
  const combinedStats = combineStats(stats1, stats2);
  expect(combinedStats).toEqual({
    lastWin: '2023-08-25',
    currentStreak: 5,
    emojiGuesses: '🇺🇸',
    gamesWon: 16,
    maxStreak: 5,
    usedGuesses: [...new Array(16).fill(1)],
  });
});

test('same lastWin date - database value should win', () => {
  const localStats: Stats = {
    lastWin: '2023-08-25',
    currentStreak: 3,
    emojiGuesses: '🟥🟥🟥',
    gamesWon: 10,
    maxStreak: 5,
    usedGuesses: [...new Array(10).fill(1)],
  };
  const accountStats: Stats = {
    lastWin: '2023-08-25',
    currentStreak: 7,
    emojiGuesses: '🟩🟩',
    gamesWon: 15,
    maxStreak: 8,
    usedGuesses: [...new Array(15).fill(1)],
  };
  const combinedStats = combineStats(localStats, accountStats);
  // When lastWin dates are equal, database (accountStats) should be preferred
  expect(combinedStats).toEqual({
    lastWin: '2023-08-25',
    currentStreak: 7,
    emojiGuesses: '🟩🟩',
    gamesWon: 15,
    maxStreak: 8,
    usedGuesses: [...new Array(15).fill(1)],
  });
});

test('database has higher streak but older date - client should win', () => {
  const localStats: Stats = {
    lastWin: '2023-08-26',
    currentStreak: 2,
    emojiGuesses: '🟥🟥',
    gamesWon: 5,
    maxStreak: 3,
    usedGuesses: [...new Array(5).fill(1)],
  };
  const accountStats: Stats = {
    lastWin: '2023-08-24',
    currentStreak: 10,
    emojiGuesses: '🟩🟩',
    gamesWon: 15,
    maxStreak: 10,
    usedGuesses: [...new Array(15).fill(1)],
  };
  const combinedStats = combineStats(localStats, accountStats);
  // When client has more recent lastWin, it should win despite lower streak
  expect(combinedStats.currentStreak).toBe(2);
  expect(combinedStats.lastWin).toBe('2023-08-26');
  // But maxStreak should be the higher value from both
  expect(combinedStats.maxStreak).toBe(10);
});

test('add game to stats', () => {
  const stats1: Stats = {
    lastWin: '2023-08-25',
    currentStreak: 5,
    emojiGuesses: '🇺🇸',
    gamesWon: 16,
    maxStreak: 5,
    usedGuesses: [...new Array(16).fill(1)],
  };
  const guesses = [getCountry('Ghana'), getCountry('Togo')];
  const ans = getCountry('Benin');
  const newStats = addGameToStats(stats1, guesses, ans);
  expect(newStats).toEqual({
    lastWin: dayjs().toString(),
    currentStreak: 1,
    emojiGuesses: '🟥🟥',
    gamesWon: 17,
    maxStreak: 5,
    usedGuesses: [...new Array(16).fill(1), 2],
  });
});
