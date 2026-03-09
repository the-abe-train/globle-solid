import { test, expect } from '@playwright/test';
import rawAnswerData from '../../src/data/country_data.json';
import { polygonDistance } from '../../src/util/geometry';

type CountryFeature = (typeof rawAnswerData)['features'][number];

const DISTANCE_BIN_KM = 5;

function formatDistanceKm(distanceInMeters: number): string {
  const valueKm = distanceInMeters / 1000;
  if (valueKm < DISTANCE_BIN_KM) return '0';
  const rounded = Math.round(valueKm / DISTANCE_BIN_KM) * DISTANCE_BIN_KM;
  return rounded.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getCountryByName(name: string): CountryFeature {
  const country = (rawAnswerData as any).features.find(
    (feature: any) => feature.properties.NAME === name,
  );
  if (!country) {
    throw new Error(`Country not found in fixture data: ${name}`);
  }
  return country;
}

async function submitGuess(page: import('@playwright/test').Page, guess: string) {
  await page.getByTestId('guesser').fill(guess);
  await page.keyboard.press('Enter');
}

async function getVisibleLabelTextForGuess(
  page: import('@playwright/test').Page,
  guess: string,
): Promise<string> {
  await page.locator('[data-cy="countries-list"] button', { hasText: guess }).click();

  let labelText = '';
  await expect
    .poll(async () => {
      const labelTexts = await page.locator('p.bg-yellow-50.text-sm').allTextContents();
      labelText = labelTexts.find((text) => text.includes(guess)) ?? '';
      return labelText.length > 0;
    })
    .toBe(true);

  return labelText;
}

test.describe('Practice labels use current round answer', () => {
  test('labels show round-2 distances relative to the current answer, not the previous round answer', async ({
    page,
  }) => {
    const firstRoundAnswerName = 'Madagascar';
    const firstRoundAnswer = getCountryByName(firstRoundAnswerName);

    await page.addInitScript((answerData) => {
      localStorage.setItem('practice', answerData as string);
      localStorage.setItem('labels', JSON.stringify({ labelsOn: true }));
      localStorage.setItem('distanceUnit', JSON.stringify({ unit: 'km' }));
    }, JSON.stringify(firstRoundAnswer));

    await page.goto('/practice');
    await expect(page.locator('p.italic')).toContainText('You are playing a practice game');

    // End round 1 and immediately start a consecutive round.
    await page.locator('button[data-i18n="Game18"]').click();
    await page.locator('button[data-i18n="Practice3"]').click();

    await expect(page.locator('p[data-testid="guess-msg"]')).toContainText('any country');

    const secondRoundAnswerName = await page.evaluate(() => {
      const practice = localStorage.getItem('practice');
      if (!practice) return '';
      return JSON.parse(practice)?.properties?.NAME ?? '';
    });

    expect(secondRoundAnswerName).toBeTruthy();

    const guessCandidates = ['Canada', 'Brazil', 'India', 'Egypt', 'Chile'];
    const guesses = guessCandidates
      .filter((name) => name !== firstRoundAnswerName && name !== secondRoundAnswerName)
      .slice(0, 2);

    expect(guesses.length).toBe(2);

    for (const guess of guesses) {
      await submitGuess(page, guess);
    }

    const secondRoundAnswer = getCountryByName(secondRoundAnswerName);

    for (const guess of guesses) {
      const guessCountry = getCountryByName(guess);

      const expectedCurrentRoundDistance = `${formatDistanceKm(
        polygonDistance(guessCountry as any, secondRoundAnswer as any),
      )} km`;

      const expectedPreviousRoundDistance = `${formatDistanceKm(
        polygonDistance(guessCountry as any, firstRoundAnswer as any),
      )} km`;

      const labelText = await getVisibleLabelTextForGuess(page, guess);

      expect(labelText).toContain(expectedCurrentRoundDistance);

      if (expectedCurrentRoundDistance !== expectedPreviousRoundDistance) {
        expect(labelText).not.toContain(expectedPreviousRoundDistance);
      }
    }
  });
});
