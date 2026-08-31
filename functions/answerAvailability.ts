const PUZZLE_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_PUZZLE_TIME_ZONE = 'UTC';

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
    PUZZLE_DATE_FORMAT.test(requestedDate) &&
    isValidTimeZone(timeZone) &&
    requestedDate === getPuzzleDateInTimeZone(now, timeZone)
  );
}
