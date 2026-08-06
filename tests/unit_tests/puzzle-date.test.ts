import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import {
  getPuzzleDate,
  isGuessDayForPuzzle,
  millisecondsUntilNextPuzzleDay,
} from '../../src/util/puzzleDate';

describe('puzzle date helpers', () => {
  const midday = new Date(2026, 7, 6, 12, 0, 0, 0);
  const puzzleDate = '2026-08-06';

  it('formats the local calendar date used by the puzzle', () => {
    expect(getPuzzleDate(midday)).toBe(puzzleDate);
  });

  it('accepts current date values and legacy end-of-day timestamps', () => {
    const legacyTimestamp = dayjs(midday).endOf('day').toDate().toISOString();

    expect(isGuessDayForPuzzle(puzzleDate, puzzleDate)).toBe(true);
    expect(isGuessDayForPuzzle(legacyTimestamp, puzzleDate)).toBe(true);
  });

  it('rejects past, future, invalid, and missing dates', () => {
    expect(isGuessDayForPuzzle('2026-08-05', puzzleDate)).toBe(false);
    expect(isGuessDayForPuzzle('2026-08-07', puzzleDate)).toBe(false);
    expect(isGuessDayForPuzzle('not-a-date', puzzleDate)).toBe(false);
    expect(isGuessDayForPuzzle(undefined, puzzleDate)).toBe(false);
  });

  it('calculates the delay to the next local day', () => {
    const oneSecondBeforeMidnight = new Date(2026, 7, 6, 23, 59, 59, 0);
    expect(millisecondsUntilNextPuzzleDay(oneSecondBeforeMidnight)).toBe(1_000);
  });
});
