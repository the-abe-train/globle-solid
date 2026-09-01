const PUZZLE_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_PUZZLE_TIME_ZONE = 'UTC';

export function isValidPuzzleDate(value: string): boolean {
  const match = value.match(PUZZLE_DATE_FORMAT);
  if (!match) return false;

  const [year, month, day] = value.split('-').map(Number);
  const normalized = new Date(Date.UTC(year, month - 1, day));
  return (
    normalized.getUTCFullYear() === year &&
    normalized.getUTCMonth() === month - 1 &&
    normalized.getUTCDate() === day
  );
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function getPuzzleDateInTimeZone(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isPuzzleDateAvailable(
  requestedDate: string,
  timeZone: string,
  now: Date = new Date(),
): boolean {
  return (
    isValidPuzzleDate(requestedDate) &&
    isValidTimeZone(timeZone) &&
    requestedDate === getPuzzleDateInTimeZone(now, timeZone)
  );
}
