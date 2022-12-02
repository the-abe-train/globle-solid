import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  Setter,
  Show,
  Switch,
} from "solid-js";
import { getContext } from "../Context";
import { langMap2 } from "../i18n";
// import { GuessStore } from "../routes/Game";
import { findCentre } from "../util/geometry";
import { GuessStore } from "../util/stores";
import { formatKm } from "../util/text";
import Toggle from "./Toggle";

type Props = {
  guesses: GuessStore;
  setPov: Setter<Coords>;
  ans: Country;
};

export default function (props: Props) {
  const context = getContext();
  const [isSortedByDistance, toggleSortByDistance] = createSignal(true);

  const langName = langMap2[context.locale().locale];

  const sortedGuesses = createMemo(() => {
    return isSortedByDistance()
      ? props.guesses.sorted
      : props.guesses.countries;
  });

  const isAlreadyShowingKm = context.distanceUnit().unit === "km";
  const [isShowingKm, setShowingKm] = createSignal(isAlreadyShowingKm);
  createEffect(() =>
    context.setDistanceUnit({ unit: isShowingKm() ? "km" : "miles" })
  );

  // const closest = () => {
  //   if (props.guesses.length === 0) return 0;
  //   const distances = props.guesses
  //     .map((guess) => guess.proximity ?? 0)
  //     .sort((a, z) => a - z);
  //   return distances[0];
  // };

  return (
    <div class="py-8 dark:text-white z-30 mb-16">
      <Switch fallback={<p>Guesses will appear here.</p>}>
        <Match when={props.guesses.length < 1}>
          <p>Guesses will appear here.</p>
        </Match>
        <Match when={isSortedByDistance()}>
          <p>Closest</p>
        </Match>
        <Match when={!isSortedByDistance()}>
          <p>Guessed</p>
        </Match>
      </Switch>
      <ul
        class="grid grid-cols-3 md:grid-cols-4 gap-3"
        data-cy="countries-list"
      >
        <For each={sortedGuesses()}>
          {(country) => {
            const { NAME_LEN, ABBREV, NAME, FLAG } = country.properties;
            const flag = (FLAG || "").toLocaleLowerCase();
            let name = NAME_LEN >= 10 ? ABBREV : NAME;
            if (context.locale().locale !== "English") {
              name = country.properties[langName] as string;
            }
            return (
              <li>
                <button
                  onClick={() => props.setPov(findCentre(country))}
                  class="flex items-center cursor-pointer"
                >
                  <img src={`https://flagcdn.com/w20/${flag}.png`} alt={name} />
                  <span class="ml-2 text-md text-left">{name}</span>
                </button>
              </li>
            );
          }}
        </For>
      </ul>
      <Show when={props.guesses.length > 0}>
        <div class="mt-8">
          <div class="flex items-center space-x-1">
            <p>Closest country: {formatKm(props.guesses.closest)}</p>
            <Toggle
              setToggle={setShowingKm}
              toggleProp={isShowingKm}
              on="km"
              off="miles"
            />
          </div>
          <p>
            <button
              onClick={() => toggleSortByDistance(!isSortedByDistance())}
              class="mt-2"
              data-cy="change-sort"
            >
              <Switch>
                <Match when={isSortedByDistance()}>
                  <span class="text-md underline">Sort by guesses</span>
                </Match>
                <Match when={!isSortedByDistance()}>
                  <span class="text-md underline">Sort by distance</span>
                </Match>
              </Switch>
            </button>
          </p>
        </div>
      </Show>
    </div>
  );
}
