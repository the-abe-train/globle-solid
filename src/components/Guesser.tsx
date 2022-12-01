import { Accessor, createEffect, createMemo, createSignal } from "solid-js";
import rawAnswerData from "../data/country_data.json";
import Fuse from "fuse.js";
import { getContext } from "../Context";
import { polygonDistance } from "../util/geometry";
import { GuessStore } from "../util/stores";

type Props = {
  guesses: GuessStore;
  addGuess: (newGuess: Country) => void;
  win: Accessor<boolean>;
  ans: Country;
};

export default function (props: Props) {
  const context = getContext();

  const isFirstGuess = () => props.guesses.length === 0;
  const isSecondGuess = () => props.guesses.length === 1;
  const mountMsg = () =>
    isFirstGuess()
      ? "Enter the name of any country to make your first guess!"
      : isSecondGuess()
      ? "Enter your next guess!"
      : "";

  const [msg, setMsg] = createSignal(mountMsg());
  const msgColour = () => {
    const green = context.theme().isDark
      ? "rgb(134 239 172)"
      : "rgb(22 101 52)";
    const neutral = context.theme().isDark ? "rgb(229 231 235)" : "black";
    return props.win() ? green : neutral;
  };

  createEffect(() => {
    if (props.win() && props.ans.properties.NAME) {
      setMsg(`The Mystery Country is ${props.ans.properties.NAME}!`);
    } else if (props.win() && !props.ans.properties.NAME) {
      setMsg("You win!");
    }
  });

  let formRef: HTMLFormElement;

  // Search indexes
  const answerIndex = createMemo(() => {
    const answers = rawAnswerData["features"] as unknown as Country[];
    return new Fuse(answers, {
      keys: [
        "properties.NAME",
        "properties.ADMIN",
        "properties.NAME_SORT",
        "properties.ABBREV",
      ],
      distance: 0,
      includeScore: true,
      getFn: (obj) => {
        const { ABBREV, NAME, ADMIN, NAME_SORT } = obj.properties;
        const abbrev = NAME.includes(" ") ? ABBREV.replace(/\./g, "") : "";
        return [NAME, ADMIN, NAME_SORT, abbrev];
      },
    });
  });

  function findCountry(newGuess: string) {
    const searchPhrase = newGuess.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const results = answerIndex().search(searchPhrase);
    console.log(results);
    if (results.length === 0) {
      setMsg(`"${newGuess}" not found in database.`);
      return;
    }
    const topAnswer = results[0];
    const topScore = topAnswer.score ?? 1;
    const { NAME } = topAnswer.item.properties;
    if (topScore < 0.02) {
      const existingGuess = props.guesses.list.find((guess) => {
        return NAME === guess.properties.NAME;
      });
      if (existingGuess) {
        setMsg(`Already guessed ${existingGuess.properties.NAME}.`);
        return;
      }
      return topAnswer.item;
    } else if (topScore < 0.5) {
      setMsg(`Did you mean ${NAME}?`);
      return;
    } else {
      setMsg(`"${newGuess}" not found in database.`);
    }
  }

  function enterGuess(e: Event) {
    e.preventDefault();
    const formData = new FormData(formRef);
    formRef.reset();
    const guess = formData.get("guess")?.toString().trim();
    if (!guess) return setMsg("Enter your next guess.");
    const newCountry = findCountry(guess);
    if (!newCountry) return;

    const name = newCountry.properties.NAME;
    const distance = polygonDistance(newCountry, props.ans);
    newCountry["proximity"] = distance;
    props.addGuess(newCountry);

    if (name === props.ans.properties.NAME) return;
    if (distance === 0) return setMsg(`${name} is adjacent to the answer!`);
    if (props.guesses.length <= 1) return setMsg(mountMsg);
    const lastGuess = props.guesses.list[props.guesses.length - 2];
    const lastDistance = lastGuess.proximity ?? 0;
    const direction = distance < lastDistance ? "warmer!" : "cooler.";
    setMsg(`${name} is ${direction}`);
  }

  return (
    <div class="my-4">
      <form
        onSubmit={enterGuess}
        class="w-80 flex space-x-4 mx-auto my-2 justify-center"
        ref={formRef!}
      >
        <input
          type="text"
          name="guess"
          class="shadow px-2 py-1 md:py-0 w-full border rounded
          text-gray-700 dark:bg-slate-200 dark:text-gray-900
          focus:outline-none focus:shadow-outline disabled:bg-slate-400
          disabled:border-slate-400"
          placeholder="Enter city name here."
          autocomplete="off"
          disabled={props.win() || !props.ans}
          data-cy="guesser"
          minLength={2}
          required
        />
        <button
          type="submit"
          class="bg-blue-700 dark:bg-purple-800 hover:bg-blue-900 
          dark:hover:bg-purple-900 dark:disabled:bg-purple-900 
          disabled:bg-blue-900 text-white 
          font-bold py-1 md:py-2 px-4 rounded focus:shadow-outline"
          disabled={props.win() || !props.ans}
          data-i18n="Game2"
        >
          Enter
        </button>
      </form>
      <p class="text-center font-medium" style={{ color: msgColour() }}>
        {msg()}
      </p>
    </div>
  );
}
