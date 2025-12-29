import { getCountry } from '../src/util/data';
import { polygonDistance } from '../src/util/geometry';
import { formatKm } from '../src/util/text';

function testDistance(country1: string, country2: string) {
  // find country objects by their names
  const c1 = getCountry(country1);
  const c2 = getCountry(country2);
  if (!c1 || !c2) {
    throw new Error('Country not found');
  }
  const distance = polygonDistance(c1, c2);
  const km = formatKm(distance);
  const miles = formatKm(distance * 0.621371);
  console.log(`Distance between ${country1} and ${country2} is ${km} km (${miles} miles)`);
}

// Get countries from command line arguments or use defaults
const [country1 = 'United States of America', country2 = 'Cuba'] = process.argv.slice(2);
testDistance(country1, country2);
