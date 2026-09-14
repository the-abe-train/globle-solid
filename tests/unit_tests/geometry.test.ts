import { describe, expect, test } from 'vitest';
import { getCountry, getTerritories } from '../../src/util/data';
import { polygonDistance } from '../../src/util/geometry';

describe('country geometry', () => {
  test('measures Lithuania against the full mainland Russia border', () => {
    const lithuania = getCountry('Lithuania');
    const russia = getCountry('Russia');

    expect(Math.round(polygonDistance(lithuania, russia) / 1000)).toBe(110);
    expect(getTerritories(russia).some(({ properties }) => properties.NAME === 'Kaliningrad')).toBe(
      true,
    );
  });
});
