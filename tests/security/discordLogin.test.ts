// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestGet } from '../../functions/discordLogin';

const fixture = {
  DISCORD_CLIENT_ID: 'fixture-client',
  DISCORD_SECRET: 'fixture-private-client-secret',
  DISCORD_STATE: '271828',
  DATABASE_NAME: 'fixture',
  MONGO_URL: '',
  MONGO_API_KEY: '',
};
const profile = { id: 'fixture-user-id', username: 'fixture-user', email: 'fixture@example.invalid' };

function captureLogs() {
  const entries: unknown[][] = [];
  for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
    vi.spyOn(console, method).mockImplementation((...args) => { entries.push(args); });
  }
  return () => JSON.stringify(entries, (_key, value) =>
    value instanceof FormData ? Object.fromEntries(value.entries()) : value
  );
}
function assertPrivateDataAbsent(logs: string) {
  for (const value of [fixture.DISCORD_SECRET, fixture.DISCORD_STATE,
    'fixture-authorization-code', 'fixture-access-token', ...Object.values(profile)]) {
    expect(logs).not.toContain(value);
  }
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Discord login logging boundary', () => {
  it('preserves the exchange and response without logging credentials or profile data', async () => {
    const logs = captureLogs();
    const network = vi.fn()
      .mockResolvedValueOnce(Response.json({ access_token: 'fixture-access-token' }))
      .mockResolvedValueOnce(Response.json(profile));
    vi.stubGlobal('fetch', network);
    const response = await onRequestGet({
      request: new Request('https://fixture.invalid/discordLogin?code=fixture-authorization-code&state=271828'),
      env: fixture,
    } as never) as Response;
    expect(network).toHaveBeenCalledTimes(2);
    expect(network.mock.calls[0][0]).toBe('https://discord.com/api/v10/oauth2/token');
    const exchange = network.mock.calls[0][1] as RequestInit;
    expect(exchange.method).toBe('POST');
    expect((exchange.body as FormData).get('client_secret')).toBe(fixture.DISCORD_SECRET);
    expect((exchange.body as FormData).get('code')).toBe('fixture-authorization-code');
    expect((network.mock.calls[1][1] as RequestInit).headers).toEqual({ Authorization: 'Bearer fixture-access-token' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(profile);
    expect(response.headers.get('cache-control')).toBe('no-cache, no-store, must-revalidate');
    assertPrivateDataAbsent(logs());
  });

  it('rejects a mismatched state before exchange without logging private state', async () => {
    const logs = captureLogs();
    const network = vi.fn(); vi.stubGlobal('fetch', network);
    const response = await onRequestGet({
      request: new Request('https://fixture.invalid/discordLogin?code=fixture-authorization-code&state=314159'),
      env: fixture,
    } as never) as Response;
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Security check failed');
    expect(network).not.toHaveBeenCalled();
    assertPrivateDataAbsent(logs());
  });
});
