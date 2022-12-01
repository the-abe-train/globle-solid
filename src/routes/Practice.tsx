import { createEffect, createSignal, lazy, Show, Suspense } from "solid-js";
import Guesser from "../components/Guesser";
import List from "../components/List";
import { createPracticeAns, getPracticeAns } from "../util/practice";
import Prompt from "../components/Prompt";
import { A, useNavigate } from "@solidjs/router";
import { createGuessStore } from "../util/stores";

const GameGlobe = lazy(() => import("../components/globes/GameGlobe"));

export default function () {
  const navigate = useNavigate();
  // Signals
  const [pov, setPov] = createSignal<Coords | null>(null);
  const [win, setWin] = createSignal(false);
  const [showPrompt, setShowPrompt] = createSignal(false);
  const [ans, setAns] = createSignal(getPracticeAns());
  const [showGlobe, setShowGlobe] = createSignal(true);

  // Stores
  // const [guesses, setGuesses] = createSignal<Country[]>([]);
  const { guesses, setGuesses } = createGuessStore([], ans());

  // Effects
  createEffect(() => {
    const winningGuess = guesses.list.find(
      (c) => c.properties.NAME === ans().properties.NAME
    );
    if (winningGuess) {
      setWin(true);
      setTimeout(() => setShowPrompt(true), 2000);
    }
  });

  // New game
  function newGame() {
    setGuesses("list", []);
    setWin(false);
    setShowGlobe(false);
    setAns(createPracticeAns());
    setTimeout(() => setShowGlobe(true), 2000);
  }

  function addGuess(newGuess: Country) {
    setGuesses("list", (prev) => [...prev, newGuess]);
    return;
  }

  function revealAnswer() {
    addGuess(ans());
  }

  return (
    <div>
      <Show when={showGlobe()} keyed fallback={<p>Loading...</p>}>
        <p class="italic">You are playing a practice game.</p>
        <Guesser addGuess={addGuess} guesses={guesses} win={win} ans={ans()} />
        <Suspense fallback={<p>Loading...</p>}>
          <GameGlobe guesses={guesses} pov={pov} ans={ans()} />
        </Suspense>
      </Show>
      <List guesses={guesses} setPov={setPov} ans={ans()} />
      <Show
        when={!win()}
        fallback={
          <button
            class="bg-blue-700 dark:bg-purple-800 hover:bg-blue-900
              dark:hover:bg-purple-900 disabled:bg-blue-900  text-white 
             focus:ring-4 focus:ring-blue-300 rounded-lg text-sm
             px-4 py-2.5 text-center w-max"
            onClick={newGame}
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
        >
          Reveal answer
        </button>
      </Show>
      <Prompt
        promptType="Choice"
        text="Play again?"
        showPrompt={showPrompt}
        setShowPrompt={setShowPrompt}
        yes={newGame}
        no={() => navigate("/")}
      />
    </div>
  );
}
