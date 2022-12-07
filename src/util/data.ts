import invariant from "tiny-invariant";
import rawCountryData from "../data/country_data.json";
import rawTerritoriesData from "../data/territories.json";

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

type Obj = {
  properties: any;
};

export const isTerritory = (x: Country | Territory): x is Territory =>
  typeof x.properties.SOVEREIGNT === "string";

export const isCountry = (x: Obj): x is Country => "CONTINENT" in x.properties;

export function closest(countries: Country[]) {
  // console.log("This", this);
  // console.log(countries);
  const distances = [...countries]
    .map((guess) => {
      // const proximity = console.log(guess.properties.NAME, guess.proximity);
      return guess.proximity ?? 50;
    })
    .sort((a, z) => a - z);
  return distances[0];
}
