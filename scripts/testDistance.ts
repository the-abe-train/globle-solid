import { getCountry } from '../src/util/data';
import { polygonDistance } from '../src/util/geometry';

function formatDistance(value: number) {
  return Math.round(value / 5) * 5;
}

function formatNumber(value: number) {
  return value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function testDistance(country1: string, country2: string) {
  // find country objects by their names
  const c1 = getCountry(country1);
  const c2 = getCountry(country2);
  if (!c1 || !c2) {
    throw new Error('Country not found');
  }
  const distance = polygonDistance(c1, c2);
  const km = formatNumber(formatDistance(distance / 1000));
  const miles = formatNumber(formatDistance((distance * 0.621371) / 1000));
  console.log(`Distance between ${country1} and ${country2} is ${km} km (${miles} miles)`);

  if (distance === 0) {
    console.log('These countries are adjacent!');
  } else {
    console.log(`Raw distance: ${distance} meters`);
  }
}

// Get countries from command line arguments or use defaults
const [country1 = 'Germany', country2 = 'Sweden'] = process.argv.slice(2);
testDistance(country1, country2);
