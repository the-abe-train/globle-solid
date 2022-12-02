import { Accessor, createEffect, createMemo, createSignal } from "solid-js";
import rawAnswerData from "../data/country_data.json";
import territories from "../data/territories.json";
import Fuse from "fuse.js";
import { getContext } from "../Context";
import { polygonDistance } from "../util/geometry";
import { GuessStore } from "../util/stores";
import i18next from "i18next";
import { langMap2 } from "../i18n";
import { isTerritory } from "../lib/assertions";
import { unwrap } from "solid-js/store";

type Props = {
  guesses: GuessStore;
  addGuess: (newGuess: Country) => void;
  win: Accessor<boolean>;
  ans: Country;
};

export default function (props: Props) {
  const context = getContext();
  const locale = context.locale().locale;
  const mountMsg = () => {
    console.log("Guesses", unwrap(props.guesses));
    if (props.guesses.length === 0) {
      return i18next.t(
        "Game3",
        "Enter the name of any country to make your first guess!"
      );
    } else if (props.guesses.length === 1) {
      return i18next.t(
        "Game4",
        "Drag, tap, and zoom in on the globe to help you find your next guess.`"
      );
    }
    return "";
  };
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
    const answers = rawAnswerData["features"] as Country[];
    const notAnswers = territories["features"] as Territory[];
    const places = [...answers, ...notAnswers];
    const keys = [
      "properties.NAME",
      "properties.ADMIN",
      "properties.NAME_SORT",
    ];
    const langKey = langMap2[locale];
    if (locale !== "English") {
      keys.push(`properties.${langKey}`);
    }
    return new Fuse(places, {
      keys,
      distance: 0,
      includeScore: true,
      getFn: (obj) => {
        let { ABBREV, NAME, ADMIN, NAME_SORT } = obj.properties;
        if (!isTerritory(obj)) {
          NAME = obj.properties[langKey] as string;
        }
        const abbrev =
          ABBREV && NAME.includes(" ") ? ABBREV.replace(/\./g, "") : "";
        const nameSort =
          NAME_SORT && NAME.includes(" ") ? NAME_SORT.replace(/\./g, "") : "";
        return [NAME, ADMIN, nameSort, abbrev];
      },
    });
  });

  function findCountry(newGuess: string) {
    const searchPhrase = newGuess.replace(/[.,\/#!$%\^&\*;:{}=\_`~()]/g, "");
    const results = answerIndex().search(searchPhrase);
    // console.log(results);
    if (results.length === 0) {
      setMsg(`"${newGuess}" not found in database.`);
      return;
    }
    const topAnswer = results[0];
    if (isTerritory(topAnswer.item)) {
      setMsg(
        `In Globle, ${topAnswer.item.properties.NAME} is a territory, not a country.`
      );
      return;
    }
    const topScore = topAnswer.score ?? 1;
    const name =
      topAnswer.item.properties[
        locale === "English" ? "NAME" : langMap2[locale]
      ];
    if (topScore < 0.001) {
      const existingGuess = props.guesses.countries.find((guess) => {
        return topAnswer.item.properties.NAME === guess.properties.NAME;
      });
      if (existingGuess) {
        setMsg(`Already guessed ${name}.`);
        return;
      }
      return topAnswer.item;
    } else if (topScore < 0.5) {
      setMsg(`Did you mean ${name}?`);
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

    const name =
      newCountry.properties[locale === "English" ? "NAME" : langMap2[locale]];
    const distance = polygonDistance(newCountry, props.ans);
    newCountry["proximity"] = distance;
    props.addGuess(newCountry);

    if (newCountry.properties.NAME === props.ans.properties.NAME) return;
    if (distance === 0) return setMsg(`${name} is adjacent to the answer!`);
    if (props.guesses.length <= 1) return setMsg(mountMsg);
    const lastGuess = props.guesses.countries[props.guesses.length - 2];
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
          placeholder={i18next.t("Game1", "Enter country name here.") ?? ""}
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
