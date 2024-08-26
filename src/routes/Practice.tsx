import {
  createEffect,
  createSignal,
  lazy,
  onMount,
  Setter,
  Show,
  Suspense,
} from "solid-js";
import Guesser from "../components/Guesser";
import List from "../components/List";
import { createPracticeAns, getPracticeAns } from "../util/practice";
import Prompt from "../components/Prompt";
import { useNavigate } from "@solidjs/router";
import { createGuessStore } from "../util/stores";
import { getTerritories } from "../util/data";
import { translate, translatePage } from "../i18n";
import NitroPayAd from "../components/NitroPayAd";

const GameGlobe = lazy(() => import("../components/globes/GameGlobe"));

export default function Outer() {
  const [ans, setAns] = createSignal(getPracticeAns());
  onMount(translatePage);

  return (
    <Show when={ans()} keyed fallback={<p data-i18n="Loading">Loading...</p>}>
      {(ans) => {
        return <Inner ans={ans} setAns={setAns} />;
      }}
    </Show>
  );
}

type InnerProps = {
  ans: Country;
  setAns: Setter<Country>;
};

function Inner(props: InnerProps) {
  const navigate = useNavigate();
  // Signals
  const [pov, setPov] = createSignal<Coords | null>(null);
  const [win, setWin] = createSignal(false);
  const [showPrompt, setShowPrompt] = createSignal(false);

  // createEffect(() => {
  //   console.log(unwrap(guesses));
  // });

  const { guesses, setGuesses } = createGuessStore([]);

  // Lifecycle
  onMount(translatePage);
  // onCleanup(() => setGuesses("closest", 12));

  // New game
  function newGame() {
    setWin(false);
    props.setAns(createPracticeAns());
  }

  function addGuess(newGuess: Country) {
    const territories = getTerritories(newGuess);
    // console.log("proximity", newGuess.proximity);
    setGuesses("places", (prev) => [...prev, newGuess, ...territories]);
    return;
  }

  function revealAnswer() {
    addGuess(props.ans);
  }

  // Effects
  createEffect(() => {
    const winningGuess = guesses.countries.find(
      (c) => c.properties.NAME === props.ans.properties.NAME
    );
    if (winningGuess) {
      setWin(true);
      setTimeout(() => setShowPrompt(true), 2000);
    }
  });

  return (
    <div>
      <p class="italic" data-i18n="Practice1">
        You are playing a practice game.
      </p>
      <Guesser
        addGuess={addGuess}
        guesses={guesses}
        win={win}
        ans={props.ans}
      />
      <Suspense fallback={<p data-i18n="Loading">Loading...</p>}>
        <GameGlobe guesses={guesses} pov={pov} ans={props.ans} />
      </Suspense>
      <List guesses={guesses} setPov={setPov} ans={props.ans} />
      <Show
        when={!win()}
        fallback={
          <button
            class="bg-blue-700 dark:bg-purple-800 hover:bg-blue-900
              dark:hover:bg-purple-900 disabled:bg-blue-900  text-white 
             focus:ring-4 focus:ring-blue-300 rounded-lg text-sm
             px-4 py-2.5 text-center w-max"
            onClick={newGame}
            data-i18n="Game14"
          >
            Play again
          </button>
        }
      >
        <button
          class="bg-blue-700 dark:bg-purple-800 hover:bg-blue-900
              dark:hover:bg-purple-900 disabled:bg-blue-900  text-white 
             focus:ring-4 focus:ring-blue-300 rounded-lg text-sm
             px-4 py-2.5 text-center w-max"
          onClick={revealAnswer}
          data-i18n="Game18"
        >
          Reveal answer
        </button>
      </Show>
      <Prompt
        promptType="Choice"
        text={translate("Practice3", "Play again") + "?"}
        showPrompt={showPrompt}
        setShowPrompt={setShowPrompt}
        yes={newGame}
        no={() => navigate("/")}
      />
      <NitroPayAd />
    </div>
  );
}
