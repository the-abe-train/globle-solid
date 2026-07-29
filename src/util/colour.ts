import {
  interpolateGreys,
  interpolateTurbo,
  interpolateBuPu,
  interpolateOrRd,
  scaleSequentialSqrt,
} from "d3";
import { isTerritory } from "../util/data";
import { polygonDistance } from "./geometry";
import { t } from "../i18n";

const GREEN_SQUARE = "🟩";
const ORANGE_SQUARE = "🟧";
const RED_SQUARE = "🟥";
const WHITE_SQUARE = "⬜";
const YELLOW_SQUARE = "🟨";

const MAX_DISTANCE = 15_000_000;

export type ColourScheme =
  | "Default"
  | "Reds"
  | "Blues"
  | "Rainbow"
  | "Grayscale";

export const getBaseColourScheme = (isDark: boolean) => {
  return {
    Default: isDark ? interpolateBuPu : interpolateOrRd,
    Reds: interpolateOrRd,
    Blues: interpolateBuPu,
    Rainbow: interpolateTurbo,
    Grayscale: interpolateGreys,
  };
};

export const getColourScheme = (isDark: boolean, doTranslate: boolean) => {
  return {
    [doTranslate ? t("Settings15", "Default") : "Default"]: isDark
      ? interpolateBuPu
      : interpolateOrRd,
    [doTranslate ? t("Settings16", "Reds") : "Reds"]: interpolateOrRd,
    [doTranslate ? t("Settings17", "Blues") : "Blues"]: interpolateBuPu,
    [doTranslate ? t("Settings18", "Rainbow") : "Rainbow"]:
      interpolateTurbo,
    [doTranslate ? t("Settings19", "Grayscale") : "Grayscale"]:
      interpolateGreys,
  };
};

export const translateColourScheme = (scheme: ColourScheme) => {
  return {
    Default: t("Settings15", "Default"),
    Reds: t("Settings16", "Reds"),
    Blues: t("Settings17", "Blues"),
    Rainbow: t("Settings18", "Rainbow"),
    Grayscale: t("Settings19", "Grayscale"),
  }[scheme];
};

export const untranslateColourScheme = (
  translatedScheme: string
): ColourScheme => {
  const translationMap = {
    [t("Settings15", "Default")]: "Default",
    [t("Settings16", "Reds")]: "Reds",
    [t("Settings17", "Blues")]: "Blues",
    [t("Settings18", "Rainbow")]: "Rainbow",
    [t("Settings19", "Grayscale")]: "Grayscale",
  };
  const englishScheme = translationMap[translatedScheme] || translatedScheme;
  return englishScheme as ColourScheme;
};

export const getColour = (
  guess: Country | Territory,
  answer: Country,
  isDark: boolean,
  colours: ColourScheme
) => {
  if (isTerritory(guess)) return "#BBBBBB";
  if (guess.properties.NAME === answer.properties.NAME) return "green";
  const proximity = polygonDistance(guess, answer);
  const colourScheme = getBaseColourScheme(isDark);
  const gradient = colourScheme[colours];
  const colorScale = scaleSequentialSqrt(gradient).domain([MAX_DISTANCE, 0]);
  const colour = colorScale(proximity);
  return colour;
};

export function getMaxColour(colours: string, isDark: boolean) {
  const gradient = getColourScheme(isDark, false)[colours];
  const maxColour = gradient(0.8);
  return maxColour;
}

const getColourEmoji = (guess: Country, answer: Country) => {
  if (guess.properties.NAME === answer.properties.NAME) return GREEN_SQUARE;
  const proximity = polygonDistance(guess, answer);
  const scale = proximity / MAX_DISTANCE;
  if (scale < 0.1) {
    return RED_SQUARE;
  } else if (scale < 0.25) {
    return ORANGE_SQUARE;
  } else if (scale < 0.5) {
    return YELLOW_SQUARE;
  } else {
    return WHITE_SQUARE;
  }
};

export function emojiString(guesses: Country[], answer: Country) {
  if (!answer) return "";
  const chunks = [];
  for (let i = 0; i < guesses.length; i += 8) {
    chunks.push(guesses.slice(i, i + 8));
  }
  const emojiGuesses = chunks
    .map((each) => each.map((guess) => getColourEmoji(guess, answer)).join(""))
    .join("\n");
  return emojiGuesses;
}
