import { test, expect } from '@playwright/test';
import rawAnswerData from '../../src/data/country_data.json';

test.describe('Play a practice game', () => {
  async function checkMsgText(page: import('@playwright/test').Page, expectedText: string) {
    await expect(page.locator('p[data-testid="guess-msg"]')).toContainText(expectedText);
  }

  test('practice game', async ({ page }) => {
    // Set fake answer in localStorage before navigation
    const answer: any = (rawAnswerData as any).features.find(
      (feature: any) => feature.properties.NAME === 'Madagascar'
    );
    await page.addInitScript((answerData) => {
      localStorage.setItem('practice', answerData as string);
    }, JSON.stringify(answer));

    // Go to practice page
    await page.goto('/practice');

    // Check for practice game message
    await expect(page.locator('p.italic')).toContainText('You are playing a practice game');

    // Enter a guess
    await page.getByTestId('guesser').fill('Canada');
    await page.keyboard.press('Enter');
    await checkMsgText(page, 'Drag, click, and zoom-in');

    // Reveal answer
    await page.locator('button[data-i18n="Game18"]').click();
    await checkMsgText(page, 'Madagascar');

  // Play again
  const yesBtn = page.locator('button[data-i18n="Yes"]');
  await expect(yesBtn).toBeVisible();
  await yesBtn.click();
    await checkMsgText(page, 'any country');
  });
});
