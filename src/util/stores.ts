import { createStore, unwrap } from "solid-js/store";
import { getCountry, isCountry } from "./data";

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
      const distances = unwrap([...this.countries])
        .map((guess) => {
          return guess.proximity ?? 50;
        })
        .sort((a, z) => a - z);
      return distances[0];
    },
    get sorted() {
      return unwrap([...this.countries]).sort((a: Country, z: Country) => {
        const proximityA = a.proximity ?? 0;
        const proximityZ = z.proximity ?? 0;
        return proximityA - proximityZ;
      });
    },
  });
  // console.log(guesses.places);
  return { guesses: guesses as GuessStore, setGuesses };
}

export type GuessStore = {
  places: (Country | Territory)[];
  readonly countries: Country[];
  readonly sorted: Country[];
  readonly length: number;
  readonly closest: number;
};
