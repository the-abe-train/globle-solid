// sum.test.js
import { expect, test } from "vitest";
import { combineStats } from "../src/util/stats";

test("sync devices", () => {
  const yesterdaysStats: Stats = {
    lastWin: "2020-01-01",
    currentStreak: 1,
    emojiGuesses: "🇺🇸",
    gamesWon: 1,
    maxStreak: 1,
    usedGuesses: [1],
  };
  const newDeviceStats: Stats = {
    lastWin: "2020-01-02",
    currentStreak: 2,
    emojiGuesses: "🇺🇸🇺🇸",
    gamesWon: 2, // This should be 3, but I don't store info info to fix it
    maxStreak: 2,
    usedGuesses: [1, 2],
  };
  const combinedStats = combineStats(yesterdaysStats, newDeviceStats);
  expect(combinedStats).toEqual({
    lastWin: "2020-01-02",
    currentStreak: 2,
    emojiGuesses: "🇺🇸🇺🇸",
    gamesWon: 3,
    maxStreak: 2,
    usedGuesses: [1, 1, 2],
  });
});

test("big streak continues", () => {
  const stats1: Stats = {
    lastWin: "2020-01-01",
    currentStreak: 5,
    emojiGuesses: "🇺🇸",
    gamesWon: 5,
    maxStreak: 5,
    usedGuesses: [1, 1, 1, 1, 1],
  };
  const stats2: Stats = {
    lastWin: "2020-01-02",
    currentStreak: 1,
    emojiGuesses: "🇺🇸🇺🇸",
    gamesWon: 1,
    maxStreak: 1,
    usedGuesses: [2],
  };
  const combinedStats = combineStats(stats1, stats2);
  expect(combinedStats).toEqual({
    lastWin: "2020-01-02",
    currentStreak: 6,
    emojiGuesses: "🇺🇸🇺🇸",
    gamesWon: 6,
    maxStreak: 6,
    usedGuesses: [1, 1, 1, 1, 1, 2],
  });
});

test("streak is broken", () => {
  const stats1: Stats = {
    lastWin: "2020-01-01",
    currentStreak: 5,
    emojiGuesses: "🇺🇸",
    gamesWon: 5,
    maxStreak: 5,
    usedGuesses: [1, 1, 1, 1, 1],
  };
  const stats2: Stats = {
    lastWin: "2020-01-03",
    currentStreak: 1,
    emojiGuesses: "🇺🇸🇺🇸",
    gamesWon: 1,
    maxStreak: 1,
    usedGuesses: [2],
  };
  const combinedStats = combineStats(stats1, stats2);
  expect(combinedStats).toEqual({
    lastWin: "2020-01-03",
    currentStreak: 1,
    emojiGuesses: "🇺🇸🇺🇸",
    gamesWon: 6,
    maxStreak: 5,
    usedGuesses: [1, 1, 1, 1, 1, 2],
  });
});
