import { UAParser } from "ua-parser-js";

import earthDay from "../images/earth-day.webp";
import earthNight from "../images/earth-night.webp";
import earthDayNoBg from "../images/earth-day-no-bg.webp";
import earthNightNoBg from "../images/earth-night-no-bg.webp";
import earthDaySafari from "../images/safari-14-earth-day.jpg";
import earthNightSafari from "../images/safari-14-earth-night.jpg";
import earthDayMin from "../images/earth-day-min.webp";
import earthNightMin from "../images/earth-night-min.webp";

import { getContext } from "../Context";
import { getColour } from "./colour";
import { formatName } from "./text";

export const globeImg = () => {
  const { theme } = getContext();
  const isDark = theme().isDark;
  const parser = new UAParser();
  const browser = parser.getBrowser();

  const isSafari = browser.name === "Safari";
  const version = parseInt(browser.version || "0");

  // const time = nightMode ? "night" : "day";
  if (isSafari && version < 14) {
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
  const parser = new UAParser();
  const browser = parser.getBrowser();

  const isSafari = browser.name === "Safari";
  const version = parseInt(browser.version || "0");

  if (isSafari && version < 14) {
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
  console.log("Creating polygon");
  const { theme } = getContext();
  const labelBg = theme().isDark ? "#F3E2F1" : "#FEFCE8";
  const output = {
    geometry: country?.geometry,
    colour: getColour(country, ans),
    label: `<p
          class="text-black py-1 px-2 text-center font-bold bg-yellow-50"
          style="background-color: ${labelBg};"
          >${formatName(country)}</p>`,
  };
  return output;
}
