import { UAParser } from "ua-parser-js";

import earthDay from "../images/earth-day.webp";
import earthNight from "../images/earth-night.webp";
import earthDayNoBg from "../images/earth-day-no-bg.webp";
import earthNightNoBg from "../images/earth-night-no-bg.webp";
import earthDaySafari from "../images/safari-14-earth-day.jpg";
import earthNightSafari from "../images/safari-14-earth-night.jpg";
import earthDayMin from "../images/earth-day-min.jpg";
import earthNightMin from "../images/earth-night-min.jpg";

import { getContext } from "../Context";
import { getColour } from "./colour";
import { formatName } from "./text";

function isSafari() {
  const parser = new UAParser();
  const browser = parser.getBrowser();
  return browser.name === "Safari";
}

export const globeImg = () => {
  const { theme } = getContext();
  const isDark = theme().isDark;
  if (isSafari()) {
    if (isDark) {
      return earthNightSafari;
    } else {
      return earthDaySafari;
    }
  } else {
    if (isDark) {
      return earthNight;
    } else {
      return earthDay;
    }
  }
};

export const globePreviewImg = () => {
  const { theme } = getContext();
  const isDark = theme().isDark;

  if (isSafari()) {
    if (isDark) {
      return earthNightSafari;
    } else {
      return earthDaySafari;
    }
  } else {
    if (isDark) {
      return earthNightNoBg;
    } else {
      return earthDayNoBg;
    }
  }
};

export const globeMinImg = () => {
  const { theme } = getContext();
  return theme().isDark ? earthNightMin : earthDayMin;
};

export function createPolygon(country: Country, ans: Country) {
  // console.log("Creating polygon");
  const { isDark } = getContext().theme();
  const { colours } = getContext().colours();
  const { locale } = getContext().locale();
  const labelBg = isDark ? "#F3E2F1" : "#FEFCE8";
  const output = {
    geometry: country?.geometry,
    colour: getColour(country, ans, isDark, colours),
    label: `<p
          class="text-black py-1 px-2 text-center font-bold bg-yellow-50"
          style="background-color: ${labelBg};"
          >${formatName(country, locale)}</p>`,
  };
  return output;
}
