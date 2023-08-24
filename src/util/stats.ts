import { props } from "cypress/types/bluebird";
import dayjs, { Dayjs } from "dayjs";
import { emojiString } from "./colour";
import { getContext } from "../Context";
import { GuessStore } from "./stores";

export function addGameToStats(
  context: ReturnType<typeof getContext>,
  guesses: GuessStore,
  ans: Country,
  lastWin: Dayjs,
  today: Dayjs
) {
  // Store new stats in local storage
  const gamesWon = context.storedStats().gamesWon + 1;
  const streakBroken = !dayjs().subtract(1, "day").isSame(lastWin, "date");
  const currentStreak = streakBroken
    ? 1
    : context.storedStats().currentStreak + 1;
  const maxStreak =
    currentStreak > context.storedStats().maxStreak
      ? currentStreak
      : context.storedStats().maxStreak;
  const usedGuesses = [...context.storedStats().usedGuesses, guesses.length];
  const emojiGuesses = emojiString(guesses.countries, ans);
  const newStats = {
    lastWin: today.toString(),
    gamesWon,
    currentStreak,
    maxStreak,
    usedGuesses,
    emojiGuesses,
  };
  return newStats;
}

export function combineStats(localStats: Stats, accountStats: Stats) {
  const mostWins =
    localStats.gamesWon > accountStats.gamesWon ? localStats : accountStats;
  const latestWin =
    new Date(localStats.lastWin) > new Date(accountStats.lastWin)
      ? localStats
      : accountStats;
  const combinedStats: Stats = {
    lastWin: latestWin.lastWin,
    currentStreak: latestWin.currentStreak,
    emojiGuesses: latestWin.emojiGuesses,
    gamesWon: mostWins.gamesWon,
    maxStreak: mostWins.maxStreak,
    usedGuesses: mostWins.usedGuesses,
  };
  return combinedStats;
}

export async function getAcctStats(
  context: ReturnType<typeof getContext>,
  googleToken: string
) {
  // Dev: Use localhost when testing locally
  const endpoint = "/account" + "?token=" + googleToken;
  const stats = context.storedStats();
  const body = JSON.stringify(stats);
  const response = await fetch(endpoint, {
    method: "POST",
    body,
  });

  // If failed to create account, show error
  if (response.status !== 200) {
    return "Failed to connect to Google account.";
  }

  // If status is "Account created", then all is well.
  if (response.statusText === "Account created") {
    return "Account created!";
  }

  // If status is "Stats found", and no local stats, use account stats
  const accountData = (await response.json()) as any;
  const accountStats = accountData.stats as Stats;
  if (!accountStats) return "Failed to connect to Google account.";
  return accountStats;

  // const localStats = context.storedStats();

  // if (localStats.gamesWon === 0) {
  //   context.storeStats(accountStats);
  //   return "Loaded stats from account.";
  // } else {
  //   // Combine local and account stats
  //   const combinedStats = combineStats(localStats, accountStats);
  //   context.storeStats(combinedStats);
  //   await fetch(endpoint, {
  //     method: "PUT",
  //     body: JSON.stringify(combinedStats),
  //   });
  //   return "Combined local and account stats.";
  // }
}
