export type ShareDeliveryMethod = 'web_share' | 'clipboard' | 'legacy_copy';

export type ShareDeliveryResult =
  | Readonly<{ status: 'success'; method: ShareDeliveryMethod }>
  | Readonly<{ status: 'cancelled' }>
  | Readonly<{ status: 'error'; error: unknown }>;

export type ShareTextPayload = Readonly<{
  title?: string;
  text: string;
}>;

type ShareNavigator = Partial<
  Pick<Navigator, 'canShare' | 'clipboard' | 'platform' | 'share' | 'userAgent'>
>;

export type ShareDeliveryEnvironment = Readonly<{
  navigator?: ShareNavigator;
  document?: Document;
  isSecureContext: boolean;
}>;

function browserEnvironment(): ShareDeliveryEnvironment {
  return {
    navigator: typeof navigator === 'undefined' ? undefined : navigator,
    document: typeof document === 'undefined' ? undefined : document,
    isSecureContext: globalThis.isSecureContext === true,
  };
}

function canUseWebShare(navigator: ShareNavigator, data: ShareTextPayload): boolean {
  if (typeof navigator.share !== 'function') return false;
  if (typeof navigator.canShare !== 'function') return false;

  try {
    return navigator.canShare(data);
  } catch {
    return false;
  }
}

function isDesktopFirefox(navigator: ShareNavigator): boolean {
  const userAgent = navigator.userAgent ?? '';
  return /\bFirefox\/\d/i.test(userAgent) && !/\bAndroid\b/i.test(userAgent);
}

function prefersClipboard(navigator: ShareNavigator): boolean {
  return (
    isDesktopFirefox(navigator) ||
    /\bWindows\b/i.test(navigator.userAgent ?? '') ||
    /^Win/i.test(navigator.platform ?? '')
  );
}

export function isShareCancellation(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
  );
}

function legacyCopy(document: Document, text: string): boolean {
  const textarea = document.createElement('textarea');
  const activeElement = document.activeElement;

  textarea.value = text;
  textarea.readOnly = true;
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.inset = '0 auto auto -9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);

  try {
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } finally {
    textarea.remove();
    if (typeof HTMLElement !== 'undefined' && activeElement instanceof HTMLElement) {
      activeElement.focus({ preventScroll: true });
    }
  }
}

async function deliverWithWebShare(
  navigator: ShareNavigator,
  data: ShareTextPayload,
): Promise<ShareDeliveryResult> {
  try {
    await navigator.share!(data);
    return { status: 'success', method: 'web_share' };
  } catch (error) {
    return isShareCancellation(error) ? { status: 'cancelled' } : { status: 'error', error };
  }
}

async function deliverWithCopy(
  navigator: ShareNavigator,
  data: ShareTextPayload,
  environment: ShareDeliveryEnvironment,
): Promise<ShareDeliveryResult> {
  const errors: unknown[] = [];
  const tryLegacyCopy = (): ShareDeliveryResult | undefined => {
    if (!environment.document) return undefined;

    try {
      if (!legacyCopy(environment.document, data.text)) {
        throw new Error('The browser rejected the copy operation');
      }
      return { status: 'success', method: 'legacy_copy' };
    } catch (error) {
      errors.push(error);
      return undefined;
    }
  };

  if (environment.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(data.text);
      return { status: 'success', method: 'clipboard' };
    } catch (error) {
      errors.push(error);
    }
  }

  const legacyResult = tryLegacyCopy();
  if (legacyResult) return legacyResult;

  if (errors.length > 0) {
    return {
      status: 'error',
      error:
        errors.length === 1
          ? errors[0]
          : new AggregateError(errors, 'Clipboard copy mechanisms failed'),
    };
  }

  return {
    status: 'error',
    error: new Error('This browser does not support sharing or copying'),
  };
}

/**
 * Delivers one plain-text result through exactly one browser channel.
 * Windows and desktop Firefox prefer copying; other capable browsers prefer
 * the native share sheet.
 */
export async function deliverShare(
  data: ShareTextPayload,
  environment: ShareDeliveryEnvironment = browserEnvironment(),
): Promise<ShareDeliveryResult> {
  const navigator = environment.navigator;
  if (!navigator) {
    return {
      status: 'error',
      error: new Error('Sharing is unavailable outside a browser'),
    };
  }

  const webShareAvailable = canUseWebShare(navigator, data);
  const copyFirst = prefersClipboard(navigator);

  if (!copyFirst && webShareAvailable) {
    return deliverWithWebShare(navigator, data);
  }

  const copyResult = await deliverWithCopy(navigator, data, environment);
  if (copyResult.status === 'success') return copyResult;

  if (copyFirst && webShareAvailable) {
    return deliverWithWebShare(navigator, data);
  }

  return copyResult;
}
