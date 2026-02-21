import { GATEWAY_GAME_NAME, MONGO_GATEWAY_BASE } from '../src/util/api';

const YYYY_MM_DD = /^(\d{4})-(\d{2})-(\d{2})$/;
const DD_MM_YYYY = /^(\d{2})-(\d{2})-(\d{4})$/;

const isValidDateParts = (year: number, month: number, day: number): boolean => {
  const normalized = new Date(Date.UTC(year, month - 1, day));
  return (
    normalized.getUTCFullYear() === year &&
    normalized.getUTCMonth() === month - 1 &&
    normalized.getUTCDate() === day
  );
};

const normalizeDailyDate = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  const ymdMatch = trimmed.match(YYYY_MM_DD);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    return isValidDateParts(year, month, day) ? trimmed : null;
  }

  const dmyMatch = trimmed.match(DD_MM_YYYY);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    if (!isValidDateParts(year, month, day)) return null;
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return null;
};

export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const target = `${MONGO_GATEWAY_BASE}/dailyStats${url.search}`;

  const headers = new Headers(request.headers);
  headers.set('X-Game-Name', GATEWAY_GAME_NAME);
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const init: RequestInit = { method: request.method, headers };
  if (hasBody) {
    const rawBody = await request.text();
    const contentType = headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      try {
        const parsedBody = JSON.parse(rawBody);
        if (
          parsedBody &&
          typeof parsedBody === 'object' &&
          !Array.isArray(parsedBody) &&
          'date' in parsedBody
        ) {
          const normalizedDate = normalizeDailyDate((parsedBody as Record<string, unknown>).date);
          if (!normalizedDate) {
            return new Response(
              JSON.stringify({
                error: 'Invalid date format. Use YYYY-MM-DD.',
              }),
              {
                status: 400,
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
          }

          (parsedBody as Record<string, unknown>).date = normalizedDate;
        }
        init.body = JSON.stringify(parsedBody);
      } catch {
        init.body = rawBody;
      }
    } else {
      init.body = rawBody;
    }
  }

  return fetch(target, init);
};
