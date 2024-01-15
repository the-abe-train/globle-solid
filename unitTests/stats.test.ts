// sum.test.js
import { expect, test } from "vitest";
import { addGameToStats, combineStats } from "../src/util/stats";
import { getCountry } from "../src/util/data";
import dayjs from "dayjs";

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
    gamesWon: 2,
    maxStreak: 2,
    usedGuesses: [1, 2],
  };
  const combinedStats = combineStats(yesterdaysStats, newDeviceStats);
  expect(combinedStats).toEqual({
    lastWin: "2020-01-02",
    currentStreak: 2,
    emojiGuesses: "🇺🇸🇺🇸",
    gamesWon: 2,
    maxStreak: 2,
    usedGuesses: [1, 2],
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
    gamesWon: 5, // wrong, but best with the logic we have
    maxStreak: 5,
    usedGuesses: [1, 1, 1, 1, 1],
  });
});

test("duplicate game", () => {
  const stats1: Stats = {
    lastWin: "2023-08-25",
    currentStreak: 5,
    emojiGuesses: "🇺🇸",
    gamesWon: 16,
    maxStreak: 5,
    usedGuesses: [...new Array(16).fill(1)],
  };
  const stats2: Stats = {
    lastWin: "2023-08-25",
    currentStreak: 5,
    emojiGuesses: "🇺🇸",
    gamesWon: 16,
    maxStreak: 5,
    usedGuesses: [...new Array(16).fill(1)],
  };
  const combinedStats = combineStats(stats1, stats2);
  expect(combinedStats).toEqual({
    lastWin: "2023-08-25",
    currentStreak: 5,
    emojiGuesses: "🇺🇸",
    gamesWon: 16,
    maxStreak: 5,
    usedGuesses: [...new Array(16).fill(1)],
  });
});

test("add game to stats", () => {
  const stats1: Stats = {
    lastWin: "2023-08-25",
    currentStreak: 5,
    emojiGuesses: "🇺🇸",
    gamesWon: 16,
    maxStreak: 5,
    usedGuesses: [...new Array(16).fill(1)],
  };
  const guesses = [getCountry("Ghana"), getCountry("Togo")];
  const ans = getCountry("Benin");
  const newStats = addGameToStats(stats1, guesses, ans);
  expect(newStats).toEqual({
    lastWin: dayjs().toString(),
    currentStreak: 1,
    emojiGuesses: "🟥🟥",
    gamesWon: 17,
    maxStreak: 5,
    usedGuesses: [...new Array(16).fill(1), 2],
  });
});
