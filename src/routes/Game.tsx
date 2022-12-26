import dayjs from "dayjs";
import {
  createEffect,
  createResource,
  createSignal,
  lazy,
  on,
  onMount,
  Setter,
  Show,
  Suspense,
} from "solid-js";
import Guesser from "../components/Guesser";
import List from "../components/List";
import { getAnswer } from "../util/encryption";
import { emojiString } from "../util/colour";
import { getContext } from "../Context";
import { getCountry, getTerritories } from "../util/data";
import { polygonDistance } from "../util/geometry";
import { translatePage } from "../i18n";
import { createGuessStore } from "../util/stores";

const GameGlobe = lazy(() => import("../components/globes/GameGlobe"));

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
  const [pov, setPov] = createSignal<Coords | null>(null);

  // const lastWin = dayjs(context.storedStats().lastWin);
  // const statsAreFresh = dayjs(context.storedGuesses().day).isAfter(dayjs());
  // const alreadyWonToday = lastWin.isSame(dayjs(), "date");

  const restoredGuesses = () => {
    const oldGuesses = context.storedGuesses();

    if (dayjs(oldGuesses.day).isAfter(dayjs())) {
      const countries = oldGuesses.countries.map((countryName) => {
        const country = getCountry(countryName);
        const proximity = polygonDistance(country, props.ans);
        country["proximity"] = proximity;
        return country;
      });
      const territories = countries.flatMap((c) => getTerritories(c));
      return [...countries, ...territories];
    }
    return [];
  };

  const { guesses, setGuesses } = createGuessStore(restoredGuesses());

  // const [win, setWin] = createSignal(statsAreFresh && alreadyWonToday);
  const [win, setWin] = createSignal(false);

  // Effects
  createEffect(() => {
    const winningGuess = guesses.countries.find(
      (c) => c.properties.NAME === props.ans.properties.NAME
    );
    if (winningGuess) setWin(true);
  });

  onMount(() => {
    translatePage();
    const expiration = dayjs(context.storedGuesses().day);
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
          guesses.length,
        ];
        const emojiGuesses = emojiString(guesses.countries, props.ans);
        const newStats = {
          lastWin: today.toString(),
          gamesWon,
          currentStreak,
          maxStreak,
          usedGuesses,
          emojiGuesses,
        };
        context.storeStats(newStats);

        // Show stats
        setTimeout(() => props.setShowStats(true), 2000);
      }
    })
  );

  function addNewGuess(newGuess: Country) {
    const territories = getTerritories(newGuess);
    setGuesses("places", (prev) => [...prev, newGuess, ...territories]);
    const countryName = newGuess.properties.NAME;
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
      <Suspense fallback={<p data-i18n="Loading">Loading...</p>}>
        <GameGlobe guesses={guesses} pov={pov} ans={props.ans} />
      </Suspense>
      <List guesses={guesses} setPov={setPov} ans={props.ans} />
    </div>
  );
}
