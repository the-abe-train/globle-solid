// Catch-all for /assets/* requests that don't match a static file.
// Without this, Cloudflare Pages serves index.html (SPA fallback) for missing
// hashed chunks after a new deploy. The HTML response gets the /assets/*
// "immutable" cache header, so the browser caches it for a year — making
// recovery reloads useless.  Returning a plain 404 with no-store prevents that.
export const onRequest: PagesFunction = async (context) => {
  // Try to serve the real static asset first
  const response = await context.env.ASSETS.fetch(context.request);

  // If the asset exists, return it as-is
  if (response.status !== 404) {
    return response;
  }

  // Asset not found — return a clean 404 instead of the SPA fallback HTML
  return new Response('Not Found', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-store',
    },
  });
};
