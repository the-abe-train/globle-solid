import { createMemo } from "solid-js";
import { getContext } from "../Context";
import { getLangKey, Locale } from "../i18n";
import { isTerritory } from "../util/data";
import { getCountry } from "./data";

export function formatKm(m: number) {
  const BIN = 5;
  const unitMap: Record<Unit, number> = {
    km: 1000,
    miles: 1609.34,
  };
  const context = getContext();
  const value = m / unitMap[context.distanceUnit().unit];
  if (value < BIN) return 0;
  const rounded = Math.round(value / BIN) * BIN;
  const format = (num: number) =>
    num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${format(rounded)}`;
}

function formatCountryName(country: Country, locale: Locale, abbreviate: boolean): string {
  const { NAME_LEN, ABBREV, NAME } = country.properties;
  const territory = isTerritory(country);
  let name = NAME;
  if (locale === "en-CA" && NAME === "Gambia") {
    name = "The Gambia";
  } else if (locale !== "en-CA" && !territory) {
    const langKey = createMemo(() => getLangKey(locale));
    name = country.properties[langKey()];
  } else if (abbreviate && NAME_LEN >= 10) {
    name = ABBREV;
  }
  if (territory) {
    const { SOVEREIGNT } = country.properties;
    const sovereigntName = formatCountryName(getCountry(SOVEREIGNT), locale, abbreviate);
    return `${name} 
    <br/> (${sovereigntName})`;
  }
  return name;
}

export function formatName(country: Country, locale: Locale): string {
  return formatCountryName(country, locale, true);
}

export function formatFullName(country: Country, locale: Locale): string {
  return formatCountryName(country, locale, false);
}
