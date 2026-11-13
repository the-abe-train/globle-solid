// Synthetic downstream contracts, not a persistence/database test.
export const violations = [];
const json = (body, status = 200) => Response.json(body, { status });
export async function fixtureFetch(input, init) {
  const request = new Request(input, init);
  const url = new URL(request.url);
  if (url.hostname === 'mongo-gateway-globle.twl-early-access.deno.net') {
    const email = url.searchParams.get('email');
    if (email && !email.endsWith('@example.test'))
      return json({ error: 'Fixture identities only' }, 400);
    if (request.method === 'GET' && url.pathname === '/account')
      return json({ twlId: email?.split('@')[0] || 'anonymous' });
    if (request.method === 'GET' && url.pathname === '/teachers')
      return json({ exists: email === 'teacher@example.test' });
    if (request.method === 'GET' && url.pathname === '/twlAccount')
      return json({ subscription: { active: email === 'member@example.test' } });
    if (['POST', 'PUT'].includes(request.method) && url.pathname === '/dailyStats')
      return json({ success: true });
  }
  if (
    url.hostname === 'sponsor-api.nitropay.com' &&
    request.method === 'GET' &&
    /^\/v1\/users\/[^/]+\/subscription$/.test(url.pathname)
  )
    return json({ status: 'inactive' });
  violations.push(request.method + ' ' + url.origin + url.pathname);
  throw new Error('Blocked outbound request: ' + violations.at(-1));
}
