import { polygonDistance } from '../src/util/geometry';
import rawCountryData from '../src/data/country_data.json';

function formatDistance(value: number) {
  return Math.round(value / 5) * 5;
}

function formatNumber(value: number) {
  return value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function findCountry(name: string) {
  const normalizedName = name.trim().toLocaleLowerCase();
  const country = (rawCountryData.features as Country[]).find(({ properties }) =>
    [properties.NAME, properties.ADMIN].some(
      (candidate) => candidate?.toLocaleLowerCase() === normalizedName
    )
  );

  if (!country) {
    throw new Error(`Country not found: ${name}`);
  }

  return country;
}

function testDistance(country1: string, country2: string) {
  // Match dataset names without requiring a particular capitalization.
  const c1 = findCountry(country1);
  const c2 = findCountry(country2);
  const distance = polygonDistance(c1, c2);
  const km = formatNumber(formatDistance(distance / 1000));
  const miles = formatNumber(formatDistance((distance * 0.621371) / 1000));
  console.log(
    `Distance between ${c1.properties.NAME} and ${c2.properties.NAME} is ${km} km (${miles} miles)`
  );

  if (distance === 0) {
    console.log('These countries are adjacent!');
  } else {
    console.log(`Raw distance: ${distance} meters`);
  }
}

// Get countries from command line arguments or use defaults
const [country1 = 'Palestine', country2 = 'Egypt'] = process.argv.slice(2);
testDistance(country1, country2);
