import { describe, expect, it, vi } from 'vitest';
import { deliverShare, type ShareDeliveryEnvironment } from '../../src/util/share';

const payload = { title: 'Globle Stats', text: '🌎 Sep 15, 2026 🌍\n🟩🟩' };

function environment(
  navigator: ShareDeliveryEnvironment['navigator'],
  overrides: Partial<ShareDeliveryEnvironment> = {},
): ShareDeliveryEnvironment {
  return { navigator, isSecureContext: true, ...overrides };
}

describe('deliverShare', () => {
  it('uses native share when the browser can share the payload', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);

    const result = await deliverShare(
      payload,
      environment({
        canShare: vi.fn().mockReturnValue(true),
        share,
        clipboard: { writeText } as unknown as Clipboard,
      }),
    );

    expect(result).toEqual({ status: 'success', method: 'web_share' });
    expect(share).toHaveBeenCalledWith(payload);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('prefers the clipboard on Windows', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);

    const result = await deliverShare(
      payload,
      environment({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        canShare: vi.fn().mockReturnValue(true),
        share,
        clipboard: { writeText } as unknown as Clipboard,
      }),
    );

    expect(result).toEqual({ status: 'success', method: 'clipboard' });
    expect(writeText).toHaveBeenCalledWith(payload.text);
    expect(share).not.toHaveBeenCalled();
  });

  it('prefers the clipboard on desktop Firefox', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);

    const result = await deliverShare(
      payload,
      environment({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:153.0) Gecko/20100101 Firefox/153.0',
        platform: 'MacIntel',
        canShare: vi.fn().mockReturnValue(true),
        share,
        clipboard: { writeText } as unknown as Clipboard,
      }),
    );

    expect(result).toEqual({ status: 'success', method: 'clipboard' });
    expect(share).not.toHaveBeenCalled();
  });

  it('keeps native sharing for Firefox on Android', async () => {
    const share = vi.fn().mockResolvedValue(undefined);

    const result = await deliverShare(
      payload,
      environment({
        userAgent: 'Mozilla/5.0 (Android 16; Mobile; rv:153.0) Gecko/153.0 Firefox/153.0',
        canShare: vi.fn().mockReturnValue(true),
        share,
      }),
    );

    expect(result).toEqual({ status: 'success', method: 'web_share' });
    expect(share).toHaveBeenCalledWith(payload);
  });

  it('does not copy when the native share sheet is dismissed', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    const result = await deliverShare(
      payload,
      environment({
        canShare: vi.fn().mockReturnValue(true),
        share: vi.fn().mockRejectedValue({ name: 'AbortError' }),
        clipboard: { writeText } as unknown as Clipboard,
      }),
    );

    expect(result).toEqual({ status: 'cancelled' });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('selects the text before using the legacy copy fallback', async () => {
    const textarea = {
      value: '',
      readOnly: false,
      style: {},
      setAttribute: vi.fn(),
      select: vi.fn(),
      setSelectionRange: vi.fn(),
      remove: vi.fn(),
    };
    const document = {
      activeElement: null,
      body: { appendChild: vi.fn() },
      createElement: vi.fn().mockReturnValue(textarea),
      execCommand: vi.fn().mockReturnValue(true),
    } as unknown as Document;

    const result = await deliverShare(
      payload,
      environment({}, { document, isSecureContext: false }),
    );

    expect(result).toEqual({ status: 'success', method: 'legacy_copy' });
    expect(textarea.value).toBe(payload.text);
    expect(textarea.select).toHaveBeenCalledOnce();
    expect(textarea.setSelectionRange).toHaveBeenCalledWith(0, payload.text.length);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(textarea.remove).toHaveBeenCalledOnce();
  });

  it('uses legacy copy when asynchronous clipboard access is denied', async () => {
    const textarea = {
      value: '',
      readOnly: false,
      style: {},
      setAttribute: vi.fn(),
      select: vi.fn(),
      setSelectionRange: vi.fn(),
      remove: vi.fn(),
    };
    const document = {
      activeElement: null,
      body: { appendChild: vi.fn() },
      createElement: vi.fn().mockReturnValue(textarea),
      execCommand: vi.fn().mockReturnValue(true),
    } as unknown as Document;
    const writeText = vi.fn().mockRejectedValue(new Error('permission denied'));

    const result = await deliverShare(
      payload,
      environment({ clipboard: { writeText } as unknown as Clipboard }, { document }),
    );

    expect(result).toEqual({ status: 'success', method: 'legacy_copy' });
    expect(writeText).toHaveBeenCalledWith(payload.text);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });
});
