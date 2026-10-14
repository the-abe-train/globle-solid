import { describe, expect, test } from 'vitest';
import { getCountry, getTerritories } from '../../src/util/data';
import { polygonDistance } from '../../src/util/geometry';

describe('country geometry', () => {
  test('includes Bimini when measuring the Bahamas against the Florida coast', () => {
    const usa = getCountry('United States of America');
    const bahamas = getCountry('Bahamas');
    const distance = polygonDistance(usa, bahamas);

    expect(distance / 1000).toBeGreaterThan(80);
    expect(distance / 1000).toBeLessThan(85);
    expect(polygonDistance(bahamas, usa)).toBe(distance);
    expect(Math.round(distance / 1609.34 / 5) * 5).toBe(50);
  });

  test('measures Lithuania against the full mainland Russia border', () => {
    const lithuania = getCountry('Lithuania');
    const russia = getCountry('Russia');

    expect(Math.round(polygonDistance(lithuania, russia) / 1000)).toBe(110);
    expect(getTerritories(russia).some(({ properties }) => properties.NAME === 'Kaliningrad')).toBe(
      true,
    );
  });
});
