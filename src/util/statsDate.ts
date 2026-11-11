import dayjs from 'dayjs';

// Puzzle dates have no timezone. Older records only have a completion timestamp.
export function lastWinPuzzleDate(stats: Pick<Stats, 'lastWin' | 'lastWinPuzzleDate'>) {
  const date = stats.lastWinPuzzleDate;
  if (
    typeof date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    dayjs(date).isValid() &&
    dayjs(date).format('YYYY-MM-DD') === date
  ) {
    return date;
  }
  return dayjs(stats.lastWin).format('YYYY-MM-DD');
}
