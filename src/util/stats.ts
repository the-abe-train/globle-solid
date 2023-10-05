import { props } from "cypress/types/bluebird";
import dayjs, { Dayjs } from "dayjs";
import { emojiString } from "./colour";
import { getContext } from "../Context";
import { GuessStore } from "./stores";
import { use } from "chai";

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

// On Oct 2, games won > 1000 was 599
// On Oct 5, games won > 1000 was 612 (oops)

export function combineStats(localStats: Stats, accountStats: Stats) {
  let mostWins =
    localStats.gamesWon > accountStats.gamesWon ? localStats : accountStats;
  const gamesWonError = localStats.gamesWon > 1000;
  if (gamesWonError) mostWins = accountStats;
  const latestStats =
    new Date(localStats.lastWin) > new Date(accountStats.lastWin)
      ? localStats
      : accountStats;
  const olderStats =
    new Date(localStats.lastWin) > new Date(accountStats.lastWin)
      ? accountStats
      : localStats;
  const prevWin = dayjs(olderStats.lastWin);
  const lastWin = dayjs(latestStats.lastWin);
  const streakContnues =
    latestStats.currentStreak < olderStats.currentStreak &&
    lastWin.subtract(1, "day").isSame(prevWin, "date");
  const currentStreak = streakContnues
    ? latestStats.currentStreak + olderStats.currentStreak
    : latestStats.currentStreak;

  const maxStreak = Math.max(
    currentStreak,
    olderStats.maxStreak,
    latestStats.maxStreak
  );

  // If no overlap, combine usedGuesses
  // TODO if browser guesses is over 600, use the stats in the db instead
  let usedGuesses = streakContnues
    ? [...olderStats.usedGuesses, ...latestStats.usedGuesses]
    : mostWins.usedGuesses;
  if (usedGuesses.length > 10_000) {
    usedGuesses = usedGuesses.slice(usedGuesses.length - 10_000);
  }

  const combinedStats: Stats = {
    lastWin: latestStats.lastWin,
    currentStreak,
    emojiGuesses: latestStats.emojiGuesses,
    gamesWon: usedGuesses.length,
    maxStreak,
    usedGuesses,
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
