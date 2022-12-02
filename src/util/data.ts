import invariant from "tiny-invariant";
import rawCountryData from "../data/country_data.json";
import rawTerritoriesData from "../data/territories.json";

// export const countryList = () => {
//   const features = rawCountryData['features'].map()

// }

export function getCountry(name: string) {
  const db = rawCountryData["features"] as Country[];
  const country = db.find((c) => c.properties.NAME === name);
  invariant(country, "An error exists in the country data.");
  return country;
}

export function getTerritories(country: Country) {
  const territoriesData = rawTerritoriesData["features"] as Territory[];
  const territories = territoriesData.filter((territory) => {
    return country.properties.NAME === territory.properties.SOVEREIGNT;
  });
  return territories;
}

// export function mapToList<T>(map: Record<string, T>) {
//   return Object.keys(map).map((name) => {
//     return { name: map[locale as T], name };
//   });
// }
