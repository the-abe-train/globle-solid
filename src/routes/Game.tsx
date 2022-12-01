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
import Guesser from "../components/Guesser";
import List from "../components/List";
import data from "../data/country_data.json";
import { getAnswer } from "../util/encryption";
// import { emojiString } from "../util/emojis";
import { getContext } from "../Context";
import { getCountry } from "../util/data";
import { polygonDistance } from "../util/distance";

// const GameGlobe = lazy(() => import("../components/globes/GameGlobe"));

type Props = {
  setShowStats: Setter<boolean>;
};

export default function (props: Props) {
  // Signals
  const context = getContext();
  const [pov, setPov] = createSignal<Coords | null>(null);

  const lastWin = dayjs(context.storedStats().lastWin);
  const [win, setWin] = createSignal(lastWin.isSame(dayjs(), "date"));

  const countries = data["features"] as unknown as Country[];
  const [ans] = createResource(getAnswer);

  const restoredGuesses = createMemo(() => {
    console.log("Recalculating restored guesses");
    return context.storedGuesses().countries.map((countryName, idx) => {
      const country = getCountry(countryName);
      const answer = ans();
      if (answer) {
        const proximity = polygonDistance(country, answer);
        country["proximity"] = proximity;
      }
      return country;
    });
  });

  // Effects
  createEffect(() => {
    const winningGuess = restoredGuesses().find(
      (c) => c.properties.NAME === ans()?.properties.NAME
    );
    if (winningGuess) setWin(true);
  });

  onMount(() => {
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

  function updateLocalStorage(newCountry: Country) {
    const countryName = newCountry.properties.NAME;
    context.storeGuesses((prev) => {
      return { ...prev, countries: [...prev.countries, countryName] };
    });
  }

  return (
    <div>
      <Show when={ans()} keyed>
        {(ans) => {
          return (
            <>
              <Guesser
                addGuess={updateLocalStorage}
                guesses={restoredGuesses}
                win={win}
                ans={ans}
              />
              {/* <Suspense fallback={<p>Loading...</p>}>
                <GameGlobe guesses={restoredGuesses} pov={pov} ans={ans} />
              </Suspense> */}
              <List guesses={restoredGuesses} setPov={setPov} ans={ans} />
            </>
          );
        }}
      </Show>
    </div>
  );
}
