import invariant from "tiny-invariant";
import rawCountryData from "../data/country_data.json";

// export const countryList = () => {
//   const features = rawCountryData['features'].map()

// }

export const getCountry = (name: string) => {
  const db = rawCountryData["features"] as unknown as Country[];
  const country = db.find((c) => c.properties.NAME === name);
  invariant(country, "An error exists in the country data.");
  return country;
};
