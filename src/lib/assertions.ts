export const isTerritory = (x: Country | Territory): x is Territory =>
  typeof x.properties.SOVEREIGNT === "string";

export const isCountry = (x: Country | Territory): x is Country =>
  "CONTINENT" in x.properties;
// typeof x.properties.CONTINENT === "string";
