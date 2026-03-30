import { lazy, type Component } from 'solid-js';

/**
 * Wraps a dynamic import with retry logic.
 * On failure, immediately triggers the boot recovery flow (full page reload)
 * since a failed chunk load almost always means a deploy changed asset hashes.
 * One retry is attempted first to handle transient network glitches.
 */
export function lazyRetry<T extends Component<any>>(importFn: () => Promise<{ default: T }>) {
  return lazy<T>(() => attempt(importFn));
}

async function attempt<T extends Component<any>>(
  importFn: () => Promise<{ default: T }>,
): Promise<{ default: T }> {
  try {
    return await importFn();
  } catch (err) {
    // One quick retry for transient network errors
    try {
      await new Promise((r) => setTimeout(r, 500));
      return await importFn();
    } catch {
      // Retry failed — almost certainly a stale asset hash after a deploy.
      // Trigger recovery (full page reload) immediately instead of retrying
      // a URL that will never resolve.
      if (typeof (window as any).__globleRecoverFromBootFailure === 'function') {
        (window as any).__globleRecoverFromBootFailure('lazy-import-failed: ' + String(err));
      }
      throw err;
    }
  }
}
