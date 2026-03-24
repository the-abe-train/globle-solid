/* @refresh reload */
/// <reference types="google.accounts" />
import { render } from 'solid-js/web';
import './index.css';
import App from './App';
import { Router } from '@solidjs/router';
import { GlobalContext, makeContext } from './Context';

const SW_CLEANUP_SESSION_KEY = 'sw-cleanup-v3';
let cleanupInProgress = false;
let cleanupCompleted = false;

const cleanupLegacyServiceWorker = async () => {
  if (cleanupInProgress || cleanupCompleted) return;
  cleanupInProgress = true;

  if (!('serviceWorker' in navigator)) {
    cleanupCompleted = true;
    cleanupInProgress = false;
    return;
  }

  try {
    let registrations: ServiceWorkerRegistration[] = [];
    if (typeof navigator.serviceWorker.getRegistrations === 'function') {
      registrations = await navigator.serviceWorker.getRegistrations();
    } else {
      const registration = await navigator.serviceWorker.getRegistration();
      registrations = registration ? [registration] : [];
    }

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

    try {
      const readyRegistration = await navigator.serviceWorker.ready;
      if (readyRegistration) {
        await readyRegistration.unregister();
      }
    } catch {
      // ignore ready failures
    }

    cleanupCompleted = true;
  } catch (error) {
    console.warn('Service worker cleanup failed', error);
  } finally {
    cleanupInProgress = false;
  }
};

void cleanupLegacyServiceWorker();
window.addEventListener('load', () => {
  void cleanupLegacyServiceWorker();
});
window.addEventListener('pageshow', () => {
  void cleanupLegacyServiceWorker();
});

render(
  () => (
    <GlobalContext.Provider value={makeContext('Stored')}>
      <App />
    </GlobalContext.Provider>
  ),
  document.getElementById('root') as HTMLElement,
);

// Signal successful boot to cancel the recovery timeout in index.html
if ((window as any).__globleBootTimer) {
  clearTimeout((window as any).__globleBootTimer);
}
