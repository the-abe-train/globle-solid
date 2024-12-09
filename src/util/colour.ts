import {
  interpolateGreys,
  interpolateTurbo,
  interpolateBuPu,
  interpolateOrRd,
  scaleSequentialSqrt,
} from "d3";
import { isTerritory } from "../util/data";
import { polygonDistance } from "./geometry";
import { translate } from "../i18n";

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

export const getColourScheme = (isDark: boolean) => {
  return {
    [translate("Settings15", "Default")]: isDark
      ? interpolateBuPu
      : interpolateOrRd,
    [translate("Settings16", "Reds")]: interpolateOrRd,
    [translate("Settings17", "Blues")]: interpolateBuPu,
    [translate("Settings18", "Rainbow")]: interpolateTurbo,
    [translate("Settings19", "Grayscale")]: interpolateGreys,
  };
};

export const getColour = (
  guess: Country | Territory,
  answer: Country,
  isDark: boolean,
  colours: string
) => {
  if (isTerritory(guess)) return "#BBBBBB";
  if (guess.properties.NAME === answer.properties.NAME) return "green";
  const proximity = polygonDistance(guess, answer);
  const gradient = getColourScheme(isDark)[colours];
  const colorScale = scaleSequentialSqrt(gradient).domain([MAX_DISTANCE, 0]);
  const colour = colorScale(proximity);
  return colour;
};

export function getMaxColour(colours: string, isDark: boolean) {
  const gradient = getColourScheme(isDark)[colours];
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
