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
import NitroPayAd from "../components/NitroPayAd";
import { addGameToStats, combineStats, getAcctStats } from "../util/stats";

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
    on(win, async () => {
      // Sync local storage with account
      const email = context.user().email;
      const endpoint = "/account" + "?email=" + email;

      // Add new game to stats
      const today = dayjs(); // TODO should be using the time from when the game started, not the time when the game ends
      const lastWin = dayjs(context.storedStats().lastWin);
      if (win() && lastWin.isBefore(today, "date")) {
        if (email) {
          const accountStats = await getAcctStats(context);
          if (typeof accountStats !== "string") {
            const localStats = context.storedStats();
            const combinedStats = combineStats(localStats, accountStats);
            console.log("Storing stats", combinedStats);
            context.storeStats(combinedStats);
          }
        }
        // Store new stats in local storage
        const newStats = addGameToStats(
          context,
          guesses,
          props.ans,
          lastWin,
          today
        );

        context.storeStats(newStats);

        // Store new stats in account
        if (email) {
          fetch(endpoint, {
            method: "PUT",
            body: JSON.stringify(newStats),
          });
        }

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
      <NitroPayAd />
    </div>
  );
}
