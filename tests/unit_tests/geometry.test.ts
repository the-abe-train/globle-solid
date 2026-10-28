import { describe, expect, test } from 'vitest';
import { getCountry, getTerritories } from '../../src/util/data';
import { polygonDistance } from '../../src/util/geometry';

describe('country geometry', () => {
  test('includes the facing Trinidad and Venezuela coastlines without dense geometry', () => {
    const trinidad = getCountry('Trinidad and Tobago');
    const venezuela = getCountry('Venezuela');
    const distance = polygonDistance(trinidad, venezuela);

    expect(distance).toBeGreaterThan(14_000);
    expect(distance).toBeLessThan(20_000);
    expect(polygonDistance(venezuela, trinidad)).toBe(distance);
    expect(Math.round(distance / 5000) * 5).toBe(15);
    for (const country of [trinidad, venezuela]) {
      const rings = country.geometry.type === 'MultiPolygon'
        ? country.geometry.coordinates.flatMap(polygon => polygon)
        : country.geometry.coordinates;
      expect(rings.flat().length).toBeLessThanOrEqual(country === trinidad ? 16 : 111);
      for (const ring of rings) {
        expect(ring[0]).toEqual(ring.at(-1));
        for (const [lng, lat] of ring) {
          expect(lng).toBeGreaterThanOrEqual(country.bbox[0]);
          expect(lat).toBeGreaterThanOrEqual(country.bbox[1]);
          expect(lng).toBeLessThanOrEqual(country.bbox[2]);
          expect(lat).toBeLessThanOrEqual(country.bbox[3]);
        }
      }
    }
  });

  test('includes Tobago as a separate island when measuring nearby countries', () => {
    const country = getCountry('Trinidad and Tobago');
    expect(country.geometry.type).toBe('MultiPolygon');
    if (country.geometry.type !== 'MultiPolygon') throw new Error('Expected two islands');
    expect(country.geometry.coordinates).toHaveLength(2);
    const [trinidad, tobago] = country.geometry.coordinates;
    expect(Math.min(...tobago[0].map(point => point[1]))).toBeGreaterThan(
      Math.max(...trinidad[0].map(point => point[1])),
    );
    const barbados = getCountry('Barbados');
    const trinidadOnly = { ...country, geometry: { type: 'Polygon' as const, coordinates: trinidad } };
    expect(polygonDistance(country, barbados)).toBeLessThan(polygonDistance(trinidadOnly, barbados));
  });

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
