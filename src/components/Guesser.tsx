import {
  Accessor,
  Show,
  createEffect,
  createMemo,
  createSignal,
} from "solid-js";
import rawAnswerData from "../data/country_data.json";
import territories from "../data/territories.json";
import Fuse from "fuse.js";
import { getContext } from "../Context";
import { polygonDistance } from "../util/geometry";
import { GuessStore } from "../util/stores";
import { getLangKey, translate } from "../i18n";
import { isTerritory } from "../util/data";
import alternateNames from "../data/alternate_names.json";
import buggyNames from "../data/buggy_names.json";
import Suggestion from "./Suggestion";

type Props = {
  guesses: GuessStore;
  addGuess: (newGuess: Country) => void;
  win: Accessor<boolean>;
  ans: Country;
};

const CORRECT_THRESHHOLD = 0.000001;
const APPROX_THRESHHOLD = 0.05;

export default function (props: Props) {
  const context = getContext();
  const locale = context.locale().locale;
  const langKey = createMemo(() => getLangKey(locale));
  const mountMsg = () => {
    if (props.guesses.length === 0) {
      return translate(
        "Game3",
        "Enter the name of any country to make your first guess!"
      );
    } else if (props.guesses.length === 1) {
      return translate(
        "Game4",
        "Drag, tap, and zoom in on the globe to help you find your next guess."
      );
    }
    return "";
  };
  const [msg, setMsg] = createSignal(mountMsg());
  const [suggestion, setSuggestion] = createSignal("");
  const msgColour = () => {
    const green = context.theme().isDark
      ? "rgb(134 239 172)"
      : "rgb(22 101 52)";
    const neutral = context.theme().isDark ? "rgb(229 231 235)" : "black";
    return props.win() ? green : neutral;
  };

  createEffect(() => {
    const { properties } = props.ans;
    const name = langKey ? (properties[langKey()] as string) : properties.NAME;
    if (props.win() && name) {
      console.log(`Win message for ${name}`);
      setMsg(
        translate("Game7", `The Mystery Country is ${name}!`, {
          answer: name,
        })
      );
    } else if (props.win()) {
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
      "properties.FORMAL_EN",
    ];
    if (locale !== "en-CA") {
      keys.push(`properties.${langKey}`);
    }
    return new Fuse(places, {
      keys,
      distance: 0,
      includeScore: true,
      getFn: (obj) => {
        let { ABBREV, NAME, ADMIN, NAME_SORT } = obj.properties;
        const abbrev =
          ABBREV && NAME.includes(" ") ? ABBREV.replace(/\./g, "") : "";
        const nameSort =
          NAME_SORT && NAME.includes(" ") ? NAME_SORT.replace(/\./g, "") : "";
        const arr = [ADMIN, nameSort, ABBREV, abbrev];
        if (!isTerritory(obj)) {
          NAME = obj.properties[langKey()] as string;
          arr.unshift(NAME);
          const formalEn = obj.properties.FORMAL_EN;
          const hasFormal = formalEn && formalEn !== NAME;
          if (hasFormal) arr.push(formalEn);
        } else {
          arr.push(NAME);
        }
        return arr;
      },
    });
  });

  function findAltName(guess: string) {
    const alts = alternateNames[locale];
    if (!alts) return;
    const map = alts.find((pair) => {
      return pair.alternative === guess.toLowerCase();
    });
    if (map) {
      return map["real"];
    }
  }

  function directSearch(guess: string) {
    const fixedGuess = guess.toLowerCase().trim();
    const countries = rawAnswerData["features"] as Country[];
    const foundCountry = countries.find((country) => {
      const { properties } = country;
      const { NAME, NAME_LONG, ABBREV, ADMIN, BRK_NAME, NAME_SORT } =
        properties;
      const name = langKey ? (properties[langKey()] as string) : NAME;
      return (
        name.toLowerCase() === fixedGuess ||
        NAME_LONG.toLowerCase() === fixedGuess ||
        ADMIN.toLowerCase() === fixedGuess ||
        ABBREV.toLowerCase() === fixedGuess ||
        ABBREV.replace(/\./g, "").toLowerCase() === fixedGuess ||
        NAME.replace(/-/g, " ").toLowerCase() === fixedGuess ||
        BRK_NAME.toLowerCase() === fixedGuess ||
        NAME_SORT.toLowerCase() === fixedGuess
      );
    });
    if (!foundCountry) {
      setMsg(
        translate("Game19", `"${guess}" not found in database.`, {
          guess,
        })
      );
      return;
    }
    const existingGuess = props.guesses.countries.find((guess) => {
      return foundCountry.properties.NAME === guess.properties.NAME;
    });
    if (existingGuess) {
      if (locale === "en-CA") {
        setMsg(`Already guessed ${foundCountry.properties.NAME}.`);
      } else {
        setMsg(translate("Game6", "Already guessed"));
      }
      return;
    }
    return foundCountry;
  }

  function findCountry(newGuess: string) {
    const cleanedGuess = newGuess.replace(/[.,\/#!$%\^&\*;:{}=\_`~()]/g, "");

    if (buggyNames?.includes(cleanedGuess.toLowerCase())) {
      setMsg(
        translate("Game19", `"${newGuess}" not found in database.`, {
          guess: newGuess,
        })
      );
      return;
    }

    // Hardcoded exceptions
    if (cleanedGuess.toLowerCase() === "namibia") {
      return directSearch("Namibia");
    } else if (cleanedGuess.toLowerCase() === "dem rep congo") {
      return directSearch("Democratic Republic of the Congo");
    } else if (cleanedGuess.toLowerCase() === "st vin and gren") {
      return directSearch("Saint Vincent and the Grenadines");
    } else if (cleanedGuess.toLowerCase() === "eq guinea") {
      return directSearch("Equatorial Guinea");
    } else if (cleanedGuess.toLowerCase() === "american samoa") {
      setMsg(`In Globle, American Samoa is a territory, not a country.`);
      return;
    }

    const searchPhrase = findAltName(cleanedGuess) ?? cleanedGuess;

    if (searchPhrase.length <= 5) {
      return directSearch(searchPhrase);
    }

    const results = answerIndex().search(searchPhrase);
    if (results.length === 0) {
      setMsg(
        translate("Game19", `"${newGuess}" not found in database.`, {
          guess: newGuess,
        })
      );
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
      topAnswer.item.properties[locale === "en-CA" ? "NAME" : langKey()];
    if (topScore < CORRECT_THRESHHOLD) {
      const existingGuess = props.guesses.countries.find((guess) => {
        return topAnswer.item.properties.NAME === guess.properties.NAME;
      });
      if (existingGuess) {
        if (locale === "en-CA") {
          setMsg(`Already guessed ${name}.`);
        } else {
          setMsg(translate("Game6", "Already guessed"));
        }
        return;
      }
      return topAnswer.item;
    } else if (topScore < APPROX_THRESHHOLD) {
      setMsg(
        translate("Game20", `Did you mean ${name}?`, {
          guess: name,
        })
      );
      setSuggestion(name);
      return;
    } else {
      setMsg(`"${newGuess}" not found in database.`);
    }
  }

  function enterGuess(e: Event) {
    e.preventDefault();
    const formData = new FormData(formRef);
    formRef.reset();
    const guess = formData.get("guess")?.toString().trim() || "";
    submitGuess(guess);
  }

  function submitGuess(guess: string) {
    console.log(`Submitting guess: ${guess}`);
    if (!guess) return setMsg("Enter your next guess.");
    const newCountry = findCountry(guess);
    if (!newCountry) return;

    const name = newCountry.properties[locale === "en-CA" ? "NAME" : langKey()];
    const distance = polygonDistance(newCountry, props.ans);
    newCountry["proximity"] = distance;
    props.addGuess(newCountry);
    const ansName =
      props.ans.properties[locale === "en-CA" ? "NAME" : langKey()];
    if (newCountry.properties.NAME === ansName) return;
    if (distance === 0) {
      if (
        (name === "Namibia" && ansName === "Zimbabwe") ||
        (name === "Zimbabwe" && ansName === "Namibia")
      ) {
        setMsg(
          translate("Game15", "{{guess}} is almost adjacent to the answer!", {
            guess: name,
          })
        );
      } else {
        console.log(
          setMsg(
            translate("Game14", "{{guess}} is adjacent to the answer!", {
              guess: name,
            })
          )
        );
      }
      return;
    }
    if (props.guesses.length <= 1) return setMsg(mountMsg);
    const lastGuess = props.guesses.countries[props.guesses.length - 2];
    const lastDistance = lastGuess.proximity ?? 0;
    if (locale === "en-CA") {
      setMsg(`${name} ${distance < lastDistance ? "is warmer" : "is cooler"}`);
    } else {
      setMsg("");
    }
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
          placeholder={translate("Game1", "Enter country name here.") ?? ""}
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

      <Show
        when={msg()?.includes("Did you mean")}
        fallback={
          <p class="text-center font-medium" style={{ color: msgColour() }}>
            {msg()}
          </p>
        }
      >
        <p class="text-center font-medium" style={{ color: msgColour() }}>
          <Suggestion countryName={suggestion()} submitGuess={submitGuess} />
        </p>
      </Show>
    </div>
  );
}
