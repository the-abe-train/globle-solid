import { createStore } from "solid-js/store";
import { isCountry } from "../lib/assertions";

export function createGuessStore(startList: (Country | Territory)[]) {
  const [guesses, setGuesses] = createStore({
    places: startList,
    get countries() {
      return this.places.filter<Country>(isCountry);
    },
    get length() {
      return this.countries.length;
    },
    get closest() {
      const distances = this.countries
        .map((guess) => guess.proximity ?? 0)
        .sort((a, z) => a - z);
      return distances[0];
    },
    get sorted() {
      return [...this.countries].sort((a: Country, z: Country) => {
        const proximityA = a.proximity ?? 0;
        const proximityZ = z.proximity ?? 0;
        return proximityA - proximityZ;
      });
    },
  });
  return { guesses: guesses as GuessStore, setGuesses };
}

export type GuessStore = {
  places: (Country | Territory)[];
  readonly countries: Country[];
  readonly sorted: Country[];
  readonly length: number;
  readonly closest: number;
};

// export type GuessStore = ReturnType<(typeof createStore)['guesses']>;
