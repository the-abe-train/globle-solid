import { getContext } from "../Context";
import { langNameMap, Locale } from "../i18n";

export function formatKm(m: number) {
  const BIN = 10;
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

export function formatName(country: Country) {
  const { locale } = getContext().locale();
  const { NAME_LEN, ABBREV, NAME } = country.properties;
  let name = NAME_LEN >= 10 ? ABBREV : NAME;
  const langName = langNameMap[locale];
  if (locale !== "en-CA") {
    name = country.properties[langName];
  }
  return name;
}
