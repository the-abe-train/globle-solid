/* @refresh reload */
/// <reference types="google.accounts" />
import { render } from 'solid-js/web';
import './index.css';
import App from './App';
import { Router } from '@solidjs/router';
import { GlobalContext, makeContext } from './Context';

const SW_CLEANUP_SESSION_KEY = 'sw-cleanup-v2';

void (async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const hadController = Boolean(navigator.serviceWorker.controller);

    const unregisterResults = await Promise.all(
      registrations.map((registration) => registration.unregister()),
    );
    const removedRegistration = unregisterResults.some(Boolean);

    let removedCache = false;
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      if (cacheKeys.length > 0) {
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
        removedCache = true;
      }
    }

    const alreadyReloaded = sessionStorage.getItem(SW_CLEANUP_SESSION_KEY) === '1';
    if (!alreadyReloaded && hadController && (removedRegistration || removedCache)) {
      sessionStorage.setItem(SW_CLEANUP_SESSION_KEY, '1');
      window.location.reload();
    }
  } catch (error) {
    console.warn('Service worker cleanup failed', error);
  }
})();

render(
  () => (
    <GlobalContext.Provider value={makeContext('Stored')}>
      <App />
    </GlobalContext.Provider>
  ),
  document.getElementById('root') as HTMLElement,
);
