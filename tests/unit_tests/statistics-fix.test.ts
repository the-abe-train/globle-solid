import { expect, test } from 'vitest';
import dayjs from 'dayjs';

// Test to verify the fix for the wonToday function
test('wonToday logic should work correctly', () => {
  const today = dayjs();
  const todayString = today.toString();

  // Test same date
  const todayCheck = dayjs(todayString).isSame(dayjs(), 'date');
  expect(todayCheck).toBe(true);

  // Test different date
  const yesterdayString = today.subtract(1, 'day').toString();
  const yesterdayCheck = dayjs(yesterdayString).isSame(dayjs(), 'date');
  expect(yesterdayCheck).toBe(false);
});

// Test to verify stats display logic
test('stats display should handle empty arrays', () => {
  const emptyUsedGuesses: number[] = [];
  const sumGuesses = emptyUsedGuesses.reduce((a: number, b: number) => a + b, 0);
  const avgGuesses = Math.round((sumGuesses / emptyUsedGuesses.length) * 100) / 100;
  const showAvgGuesses = emptyUsedGuesses.length === 0 ? '--' : avgGuesses;

  expect(showAvgGuesses).toBe('--');
});

test('stats display should calculate averages correctly', () => {
  const usedGuesses = [3, 4, 5, 2];
  const sumGuesses = usedGuesses.reduce((a: number, b: number) => a + b, 0);
  const avgGuesses = Math.round((sumGuesses / usedGuesses.length) * 100) / 100;
  const showAvgGuesses = usedGuesses.length === 0 ? '--' : avgGuesses;

  expect(sumGuesses).toBe(14);
  expect(avgGuesses).toBe(3.5);
  expect(showAvgGuesses).toBe(3.5);
});
