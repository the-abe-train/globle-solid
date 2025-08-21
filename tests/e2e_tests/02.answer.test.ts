import { test, expect } from '@playwright/test';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import rawAnswerData from '../../src/data/country_data.json';
import dotenv from 'dotenv';

dotenv.config();

test.describe('Game play tests', () => {
  function decryptName(encryptedAnsKey: string): string {
    const cryptoKey = process.env.CRYPTO_KEY;
    if (!cryptoKey) throw new Error('CRYPTO_KEY is not defined');
    const bytes = AES.decrypt(encryptedAnsKey, cryptoKey);
    const originalText = bytes.toString(Utf8);
    const answerKey = parseInt(originalText);
    expect(answerKey).toBeGreaterThanOrEqual(0);
    const feature: any = (rawAnswerData as any).features[answerKey];
    return feature.properties.NAME as string;
  }

  test('should access environment variables', async () => {
    expect(process.env.CRYPTO_KEY).toBeDefined();
  });

  test("plays today's game", async ({ page }) => {
    // Start waiting for the /answer response before navigation to avoid a race
    const answerResponsePromise = page.waitForResponse((res) => res.url().includes('/answer'));

    await page.goto('/game');

    const answerResponse = await answerResponsePromise;
    const payload = await answerResponse.json();
    const answer = decryptName(payload.answer);

    await page.getByTestId('guesser').fill(answer);
    await page.keyboard.press('Enter');

    await expect(page.getByText('Statistics', { exact: false })).toBeVisible();
  });
});
