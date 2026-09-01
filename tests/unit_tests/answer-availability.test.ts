import { describe, expect, it } from 'vitest';
import {
  getPuzzleDateInTimeZone,
  isPuzzleDateAvailable,
  isValidPuzzleDate,
  isValidTimeZone,
} from '../../functions/answerAvailability';
import { handleAnswerRequest } from '../../functions/answer';

const now = new Date('2026-08-31T22:00:00.000Z');

function createContext(url: string, method = 'GET') {
  return {
    request: new Request(url, { method }),
    env: { CRYPTO_KEY: 'test-key' },
  } as unknown as Parameters<typeof handleAnswerRequest>[0];
}

describe('answer availability', () => {
  it('calculates the current puzzle date in the requested time zone', () => {
    expect(getPuzzleDateInTimeZone(now, 'UTC')).toBe('2026-08-31');
    expect(getPuzzleDateInTimeZone(now, 'Pacific/Kiritimati')).toBe('2026-09-01');
    expect(getPuzzleDateInTimeZone(now, 'America/Los_Angeles')).toBe('2026-08-31');
  });

  it('only accepts the date currently available in that time zone', () => {
    expect(isPuzzleDateAvailable('2026-08-31', 'UTC', now)).toBe(true);
    expect(isPuzzleDateAvailable('2026-08-30', 'UTC', now)).toBe(false);
    expect(isPuzzleDateAvailable('2026-09-01', 'UTC', now)).toBe(false);
    expect(isPuzzleDateAvailable('2026-09-01', 'Pacific/Kiritimati', now)).toBe(true);
  });

  it('rejects invalid dates and time zones', () => {
    expect(isValidTimeZone('Not/A_Time_Zone')).toBe(false);
    expect(isValidPuzzleDate('2026-08-31')).toBe(true);
    expect(isValidPuzzleDate('August 31, 2026')).toBe(false);
    expect(isValidPuzzleDate('2026-02-30')).toBe(false);
    expect(isPuzzleDateAvailable('August 31, 2026', 'UTC', now)).toBe(false);
    expect(isPuzzleDateAvailable('2026-08-31', 'Not/A_Time_Zone', now)).toBe(false);
  });

  it('serves the current puzzle and rejects unavailable dates', async () => {
    const current = await handleAnswerRequest(
      createContext('https://example.com/answer?day=2026-08-31&timeZone=UTC'),
      now,
    );
    expect(current.status).toBe(200);
    await expect(current.json()).resolves.toMatchObject({
      message: 'Mystery country retrieved.',
      answer: expect.any(String),
    });

    const past = await handleAnswerRequest(
      createContext('https://example.com/answer?day=2026-08-30&timeZone=UTC'),
      now,
    );
    expect(past.status).toBe(404);

    const future = await handleAnswerRequest(
      createContext('https://example.com/answer?day=2026-09-01&timeZone=UTC'),
      now,
    );
    expect(future.status).toBe(404);
  });

  it('rejects unsupported methods', async () => {
    const response = await handleAnswerRequest(
      createContext('https://example.com/answer?day=2026-08-31&timeZone=UTC', 'POST'),
      now,
    );
    expect(response.status).toBe(405);
  });

  it('rejects missing, malformed, and impossible dates with 400', async () => {
    const missing = await handleAnswerRequest(createContext('https://example.com/answer'), now);
    expect(missing.status).toBe(400);

    const malformed = await handleAnswerRequest(
      createContext('https://example.com/answer?day=August-31&timeZone=UTC'),
      now,
    );
    expect(malformed.status).toBe(400);

    const impossible = await handleAnswerRequest(
      createContext('https://example.com/answer?day=2026-02-30&timeZone=UTC'),
      now,
    );
    expect(impossible.status).toBe(400);
  });
});
