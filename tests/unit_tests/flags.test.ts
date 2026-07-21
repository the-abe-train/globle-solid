import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import countryData from '../../src/data/country_data.json';
import { getFlagAssetPath, handleFlagLoadError, normalizeFlagCode } from '../../src/util/flags';

describe('country flags', () => {
  test('normalizes ISO codes without locale-sensitive characters', () => {
    expect(normalizeFlagCode('IT')).toBe('it');
    expect(normalizeFlagCode('IN')).toBe('in');
    expect(getFlagAssetPath('CI')).toBe('/flags/ci.png');
  });

  test('has a local asset for every country in the dataset', () => {
    const flags = new Set(countryData.features.map((country) => country.properties.FLAG));

    for (const flag of flags) {
      const assetPath = resolve(process.cwd(), 'public', getFlagAssetPath(flag).slice(1));
      expect(existsSync(assetPath), `missing local flag for ${flag}`).toBe(true);
    }
  });

  test('tries the remote fallback once, then hides a broken image', () => {
    const image = document.createElement('img');
    image.addEventListener('error', (event) => handleFlagLoadError(event, 'IT'));

    image.dispatchEvent(new Event('error'));
    expect(image.src).toBe('https://flagcdn.com/w20/it.png');
    expect(image.hidden).toBe(false);

    image.dispatchEvent(new Event('error'));
    expect(image.hidden).toBe(true);
  });
});
