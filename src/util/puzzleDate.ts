import dayjs from 'dayjs';

const PUZZLE_DATE_FORMAT = 'YYYY-MM-DD';

export function getPuzzleDate(now: Date = new Date()) {
  return dayjs(now).format(PUZZLE_DATE_FORMAT);
}

/**
 * Accept both the current YYYY-MM-DD value and the legacy ISO timestamp that
 * was previously stored as `guesses.day`.
 */
export function isGuessDayForPuzzle(value: unknown, puzzleDate = getPuzzleDate()) {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    return false;
  }

  const storedDay = dayjs(value);
  return storedDay.isValid() && storedDay.format(PUZZLE_DATE_FORMAT) === puzzleDate;
}

export function millisecondsUntilNextPuzzleDay(now: Date = new Date()) {
  const currentTime = dayjs(now);
  return Math.max(1, currentTime.endOf('day').diff(currentTime) + 1);
}
