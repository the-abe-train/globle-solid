import { test, expect } from '@playwright/test';
import rawAnswerData from '../../src/data/country_data.json';

test.describe('Settings tests', () => {
  const getNepalFill = async (page: import('@playwright/test').Page) => {
    const path = page.locator('#Nepal path');
    await expect(path).toBeVisible();
    const handle = await path.elementHandle();
    return handle!.evaluate((el) => window.getComputedStyle(el as Element).fill);
  };

  test.describe('Explore changing the colours and theme', () => {
    test('checks the reds', async ({ page }) => {
      await page.goto('/');
      const fillColor = await getNepalFill(page);
      expect(fillColor).toBe('rgb(251, 147, 97)');
    });

    test('check the blues', async ({ page }) => {
      await page.goto('/settings');
      await page.locator('[data-cy="toggle-Night-Day"]').click();
      await page.waitForFunction(() => {
        try {
          return JSON.parse(localStorage.getItem('theme') || '{}').isDark === true;
        } catch {
          return false;
        }
      });

      await page.goto('/');
      let fillColor = await getNepalFill(page);
      expect(fillColor).toBe('rgb(144, 153, 200)');

      await page.goto('/settings');
      await page.locator('[name="Colours"]').selectOption('Blues');
      await page.waitForFunction(() => {
        try {
          return JSON.parse(localStorage.getItem('colours') || '{}').colours === 'Blues';
        } catch {
          return false;
        }
      });

      await page.goto('/');
      fillColor = await getNepalFill(page);
      expect(fillColor).toBe('rgb(144, 153, 200)');
    });

    test('checks the other colours', async ({ page }) => {
      await page.goto('/settings');
      await page.locator('[name="Colours"]').selectOption('Rainbow');
      await page.waitForFunction(() => {
        try {
          return JSON.parse(localStorage.getItem('colours') || '{}').colours === 'Rainbow';
        } catch {
          return false;
        }
      });
      await page.goto('/');
      let fillColor = await getNepalFill(page);
      expect(fillColor).toBe('rgb(138, 252, 86)');

      await page.goto('/settings');
      await page.locator('[name="Colours"]').selectOption('Grayscale');
      await page.waitForFunction(() => {
        try {
          return JSON.parse(localStorage.getItem('colours') || '{}').colours === 'Grayscale';
        } catch {
          return false;
        }
      });
      await page.goto('/');
      fillColor = await getNepalFill(page);
      expect(fillColor).toBe('rgb(155, 155, 155)');
    });
  });

  test.describe('Explore changing the language', () => {
    test('checks the game translates into French', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-i18n="helpTitle"]')).toContainText('How to Play');

      await page.goto('/settings');
      await page.locator('[name="Language"]').selectOption('fr-FR');

      await expect(page.locator('[data-i18n="SettingsTitle"]')).toContainText('Paramètres');

      // Seed practice mode with Madagascar before navigating
      const answer: any = (rawAnswerData as any).features.find(
        (feature: any) => feature.properties.NAME === 'Madagascar'
      );
      await page.addInitScript((answerData) => {
        localStorage.setItem('practice', answerData as string);
      }, JSON.stringify(answer));

      await page.goto('/practice');
      await page.getByTestId('guesser').type('libye');
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-cy="countries-list"]')).toContainText('Libye');

      await page.getByTestId('guesser').type('royaume-uni');
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-cy="countries-list"]')).toContainText('Royaume-Uni');
    });
  });
});
