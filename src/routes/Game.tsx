import dayjs from "dayjs";
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  lazy,
  on,
  onMount,
  Setter,
  Show,
  Suspense,
} from "solid-js";
import { createStore } from "solid-js/store";
import Guesser from "../components/Guesser";
import List from "../components/List";
import data from "../data/country_data.json";
import { getAnswer } from "../util/encryption";
// import { emojiString } from "../util/emojis";
import { getContext } from "../Context";
import { getCountry } from "../util/data";
import { polygonDistance } from "../util/geometry";
import GameGlobe from "../components/globes/GameGlobe";
import { getColour } from "../util/colour";
import { formatName } from "../util/text";
import { translatePage } from "../i18n";

// const GameGlobe = lazy(() => import("../components/globes/GameGlobe"));

type OuterProps = {
  setShowStats: Setter<boolean>;
};

export default function Outer(props: OuterProps) {
  const [ans] = createResource(getAnswer);
  return (
    <Show when={ans()} keyed>
      {(ans) => {
        return <Inner setShowStats={props.setShowStats} ans={ans} />;
      }}
    </Show>
  );
}

type Props = {
  setShowStats: Setter<boolean>;
  ans: Country;
};

function Inner(props: Props) {
  // Signals
  const context = getContext();
  const { locale } = getContext().locale();
  const [pov, setPov] = createSignal<Coords | null>(null);

  const lastWin = dayjs(context.storedStats().lastWin);
  const [win, setWin] = createSignal(lastWin.isSame(dayjs(), "date"));

  const restoredGuesses = context
    .storedGuesses()
    .countries.map((countryName) => {
      const country = getCountry(countryName);
      const proximity = polygonDistance(country, props.ans);
      country["proximity"] = proximity;
      return country;
    });

  const [guesses, setGuesses] = createStore({
    list: restoredGuesses,
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
      const labelBg = context.theme().isDark ? "#F3E2F1" : "#FEFCE8";
      return this.list.map((country) => {
        const output = {
          geometry: country?.geometry,
          colour: getColour(country, props.ans),
          label: `<p
          class="text-black py-1 px-2 text-center font-bold bg-yellow-50"
          style="background-color: ${labelBg};"
          >${formatName(country, locale)}</p>`,
        };
        return output;
      });
    },
  });

  // Effects
  createEffect(() => {
    const winningGuess = guesses.list.find(
      (c) => c.properties.NAME === props.ans.properties.NAME
    );
    if (winningGuess) setWin(true);
  });

  onMount(() => {
    translatePage();
    const expiration = dayjs(context.storedGuesses().expiration);
    if (dayjs().isAfter(expiration)) context.resetGuesses();
    if (win()) setTimeout(() => props.setShowStats(true), 3000);
  });

  // When the player wins!
  createEffect(
    on(win, () => {
      const today = dayjs();
      const lastWin = dayjs(context.storedStats().lastWin);
      if (win() && lastWin.isBefore(today, "date")) {
        // Store new stats in local storage
        const gamesWon = context.storedStats().gamesWon + 1;
        const streakBroken = !dayjs()
          .subtract(1, "day")
          .isSame(lastWin, "date");
        const currentStreak = streakBroken
          ? 1
          : context.storedStats().currentStreak + 1;
        const maxStreak =
          currentStreak > context.storedStats().maxStreak
            ? currentStreak
            : context.storedStats().maxStreak;
        const usedGuesses = [
          ...context.storedStats().usedGuesses,
          context.storedGuesses().countries.length,
        ];
        // const emojiGuesses = emojiString(restoredGuesses(), ans());
        const newStats = {
          lastWin: today.toString(),
          gamesWon,
          currentStreak,
          maxStreak,
          usedGuesses,
          // emojiGuesses,
        };
        // context.storeStats(newStats);

        // Show stats
        setTimeout(() => props.setShowStats(true), 2000);
      }
    })
  );

  function addNewGuess(newCountry: Country) {
    const countryName = newCountry.properties.NAME;

    setGuesses("list", (prev) => [...prev, newCountry]);
    context.storeGuesses((prev) => {
      return { ...prev, countries: [...prev.countries, countryName] };
    });
  }

  return (
    <div>
      <Guesser
        addGuess={addNewGuess}
        guesses={guesses}
        win={win}
        ans={props.ans}
      />
      <Suspense fallback={<p>Loading...</p>}>
        <GameGlobe guesses={guesses} pov={pov} ans={props.ans} />
      </Suspense>
      <List guesses={guesses} setPov={setPov} ans={props.ans} />
    </div>
  );
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
