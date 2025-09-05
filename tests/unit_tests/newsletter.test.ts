import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  subscribeToNewsletter,
  isEmailSubscribed,
  clearSubscriptionHistory,
} from '../../src/util/newsletter';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

describe('Newsletter Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('subscribeToNewsletter', () => {
    it('should not subscribe if email is empty', async () => {
      const result = await subscribeToNewsletter('');
      expect(result).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should not subscribe if user opted out', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'twlNewsletter') return 'false';
        return null;
      });

      const result = await subscribeToNewsletter('test@example.com');
      expect(result).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should not subscribe if email already subscribed', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'twlNewsletter') return 'true';
        if (key === 'twlNewsletterSubscribed') return JSON.stringify(['test@example.com']);
        return null;
      });

      const result = await subscribeToNewsletter('test@example.com');
      expect(result).toBe(true);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should subscribe successfully', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'twlNewsletter') return 'true';
        if (key === 'twlNewsletterSubscribed') return null;
        return null;
      });

      (fetch as any).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('Success'),
      });

      const result = await subscribeToNewsletter('test@example.com');
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscribe'),
        expect.objectContaining({
          method: 'POST',
          body: 'test@example.com',
        }),
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'twlNewsletterSubscribed',
        JSON.stringify(['test@example.com']),
      );
    });

    it('should handle subscription error', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'twlNewsletter') return 'true';
        if (key === 'twlNewsletterSubscribed') return null;
        return null;
      });

      (fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await subscribeToNewsletter('test@example.com');
      expect(result).toBe(false);
    });
  });

  describe('isEmailSubscribed', () => {
    it('should return false if no emails subscribed', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(isEmailSubscribed('test@example.com')).toBe(false);
    });

    it('should return true if email is subscribed', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['test@example.com']));
      expect(isEmailSubscribed('test@example.com')).toBe(true);
    });

    it('should return false if email is not in subscribed list', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['other@example.com']));
      expect(isEmailSubscribed('test@example.com')).toBe(false);
    });
  });

  describe('clearSubscriptionHistory', () => {
    it('should remove subscription history from localStorage', () => {
      clearSubscriptionHistory();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('twlNewsletterSubscribed');
    });
  });
});
