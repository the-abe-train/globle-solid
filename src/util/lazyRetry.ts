import { lazy, type Component } from 'solid-js';

/**
 * Wraps a dynamic import with retry logic and cache-busting.
 * On final failure, triggers the boot recovery flow if available.
 */
export function lazyRetry<T extends Component<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 2,
) {
  return lazy<T>(() => attempt(importFn, retries));
}

async function attempt<T extends Component<any>>(
  importFn: () => Promise<{ default: T }>,
  retriesLeft: number,
): Promise<{ default: T }> {
  try {
    return await importFn();
  } catch (err) {
    if (retriesLeft > 0) {
      // Small delay before retry
      await new Promise((r) => setTimeout(r, 1000));
      return attempt(importFn, retriesLeft - 1);
    }

    // All retries exhausted — trigger recovery if not already attempted
    if (typeof (window as any).__globleRecoverFromBootFailure === 'function') {
      (window as any).__globleRecoverFromBootFailure(
        'lazy-import-failed: ' + String(err),
      );
    }

    throw err;
  }
}
