import { createStore } from "solid-js/store";
import { getContext } from "../Context";
import { Locale } from "../i18n";
import { getColour } from "./colour";
import { formatName } from "./text";

export function createGuessStore(
  startList: Country[],
  // isDark: boolean,
  // locale: Locale,
  ans: Country
) {
  const context = getContext();
  const isDark = context.theme().isDark;
  const locale = context.locale().locale;
  const [guesses, setGuesses] = createStore({
    list: startList,
    get length() {
      return this.list.length;
    },
    get closest() {
      const distances = this.list
        .map((guess) => guess.proximity ?? 0)
        .sort((a, z) => a - z);
      return distances[0];
    },
    get sorted() {
      return [...this.list].sort((a: Country, z: Country) => {
        const proximityA = a.proximity ?? 0;
        const proximityZ = z.proximity ?? 0;
        return proximityA - proximityZ;
      });
    },
    get polygons() {
      const labelBg = isDark ? "#F3E2F1" : "#FEFCE8";
      return this.list.map((country) => {
        const output = {
          geometry: country?.geometry,
          colour: getColour(country, ans),
          label: `<p
          class="text-black py-1 px-2 text-center font-bold bg-yellow-50"
          style="background-color: ${labelBg};"
          >${formatName(country, locale)}</p>`,
        };
        return output;
      });
    },
  });
  return { guesses: guesses as GuessStore, setGuesses };
}

type Polygon = {
  geometry:
    | {
        type: "Polygon";
        coordinates: number[][][];
      }
    | {
        type: "MultiPolygon";
        coordinates: number[][][][];
      };
  colour: string;
  label: string;
};

export type GuessStore = {
  list: Country[];
  readonly sorted: Country[];
  readonly polygons: Polygon[];
  readonly length: number;
  readonly closest: number;
};

// export type GuessStore = ReturnType<(typeof createStore)['guesses']>;
