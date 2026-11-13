import { test, expect } from 'vitest';
import { fixtureFetch, violations } from './gateway.mjs';
test('rejects unrecognized outbound hosts without invoking a network client', async () => {
  await expect(fixtureFetch('https://unexpected.invalid/private')).rejects.toThrow(
    'Blocked outbound',
  );
  expect(violations.pop()).toBe('GET https://unexpected.invalid/private');
});
test('synthetic membership remains distinct from teacher status', async () => {
  const base = 'https://mongo-gateway-globle.twl-early-access.deno.net';
  expect(await (await fixtureFetch(base + '/twlAccount?email=member@example.test')).json()).toEqual(
    { subscription: { active: true } },
  );
  expect(await (await fixtureFetch(base + '/teachers?email=teacher@example.test')).json()).toEqual({
    exists: true,
  });
  expect((await fixtureFetch(base + '/account?email=real@invalid.com')).status).toBe(400);
});
