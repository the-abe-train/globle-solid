import dayjs, { Dayjs } from 'dayjs';
import { z } from 'zod';
import { emojiString } from './colour';
import { getContext } from '../Context';
import { GuessStore } from './stores';
import { MONGO_GATEWAY_BASE, withGatewayHeaders } from './api';

// Zod schema for Stats validation
const StatsSchema = z.object({
  gamesWon: z.number(),
  lastWin: z.string(),
  currentStreak: z.number(),
  maxStreak: z.number(),
  usedGuesses: z.array(z.number()),
  emojiGuesses: z.string(),
});

const AccountDataSchema = z.object({
  stats: StatsSchema,
});

export function addGameToStats(storedStats: Stats, guesses: Country[], ans: Country) {
  const today = dayjs();
  const lastWin = dayjs(storedStats.lastWin);

  // Check if user has already won today - if so, don't add duplicate game
  if (today.isSame(lastWin, 'date')) {
    console.log('Game already won today - not adding duplicate');
    return storedStats;
  }

  // Store new stats in local storage
  const gamesWon = storedStats.gamesWon + 1;
  const streakBroken = !dayjs().subtract(1, 'day').isSame(lastWin, 'date');
  const currentStreak = streakBroken ? 1 : storedStats.currentStreak + 1;
  const maxStreak = currentStreak > storedStats.maxStreak ? currentStreak : storedStats.maxStreak;
  const usedGuesses = [...storedStats.usedGuesses, guesses.length];
  const emojiGuesses = emojiString(guesses, ans);
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
  const localLastWin = dayjs(localStats.lastWin);
  const accountLastWin = dayjs(accountStats.lastWin);

  // If both stats are from the same day, this is a duplicate - return database version
  // Compare dates only (not timestamps) to avoid issues with different time formats
  if (localLastWin.isSame(accountLastWin, 'date')) {
    console.log('Same lastWin date detected - using database stats to avoid duplication');
    return accountStats;
  }

  let mostWins = localStats.gamesWon > accountStats.gamesWon ? localStats : accountStats;
  // const gamesWonError = localStats.gamesWon > 1000;
  // if (gamesWonError) mostWins = accountStats;

  // Determine latest stats: prioritize most recent date
  const latestStats = localLastWin.isAfter(accountLastWin, 'date') ? localStats : accountStats;
  const olderStats = localLastWin.isAfter(accountLastWin, 'date') ? accountStats : localStats;
  // const latestStats = localStats;
  // const olderStats = accountStats;
  const prevWin = dayjs(olderStats.lastWin);
  const lastWin = dayjs(latestStats.lastWin);
  const streakContnues =
    latestStats.currentStreak < olderStats.currentStreak &&
    lastWin.subtract(1, 'day').isSame(prevWin, 'date');
  const currentStreak = streakContnues
    ? latestStats.currentStreak + olderStats.currentStreak
    : latestStats.currentStreak;

  const maxStreak = Math.max(currentStreak, olderStats.maxStreak, latestStats.maxStreak);

  // If no overlap, combine usedGuesses
  let usedGuesses = streakContnues
    ? [...olderStats.usedGuesses, ...latestStats.usedGuesses]
    : mostWins.usedGuesses;
  if (usedGuesses.length > 10_000) {
    usedGuesses = usedGuesses.slice(usedGuesses.length - 10_000);
  }

  // Error handling
  if (maxStreak > usedGuesses.length || currentStreak > usedGuesses.length) {
    console.error('Streak is greater than games won.');
    return localStats;
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

export async function getAcctStats(context: ReturnType<typeof getContext>) {
  // Dev: Use localhost when testing locally
  // const stats = context.storedStats();
  const email = context.user().email;

  if (!email) {
    console.error('getAcctStats called without email');
    return 'No email provided';
  }

  const endpoint = `${MONGO_GATEWAY_BASE}/account?email=${encodeURIComponent(email)}`;

  try {
    console.log('Fetching account stats for:', email);

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(endpoint, {
      ...withGatewayHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('Account stats response status:', response.status, response.statusText);

    // If failed to fetch account, show error
    if (response.status !== 200) {
      console.error('Failed to fetch account stats. Status:', response.status);
      return `Failed to connect to account. Status: ${response.status}`;
    }

    // If status is "Account created", then all is well.
    if (response.statusText === 'Account created') {
      console.log('New account created');
      return 'Account created!';
    }

    // Parse and validate response with Zod
    const rawData = await response.json();
    console.log('Account data received:', rawData);

    // Validate the entire account data structure
    const validationResult = AccountDataSchema.safeParse(rawData);

    if (!validationResult.success) {
      console.error('Invalid account data structure:', validationResult.error.format());
      return 'Invalid stats structure received from server';
    }

    const accountStats = validationResult.data.stats;

    console.log('Successfully fetched and validated account stats:', {
      gamesWon: accountStats.gamesWon,
      lastWin: accountStats.lastWin,
      currentStreak: accountStats.currentStreak,
    });

    return accountStats;
  } catch (error: any) {
    // Handle specific error types
    if (error.name === 'AbortError') {
      console.error('Account stats fetch timed out after 10 seconds');
      return 'Request timed out';
    }
    console.error('Error fetching account stats:', error);
    return `Error: ${error.message || 'Unknown error'}`;
  }
}
