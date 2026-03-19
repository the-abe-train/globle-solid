// Self-destruct service worker.
// This file exists so that any old service worker that checks for updates
// will fetch this version, activate it, and immediately unregister itself,
// freeing users from stale cached content.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clear all caches
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      // Take control of all clients immediately
      await self.clients.claim();
      // Unregister this service worker
      await self.registration.unregister();
      // Reload all open tabs so they fetch fresh content from the network
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
