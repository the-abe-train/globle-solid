import i18next from 'i18next';
import { createEffect, createMemo, createSignal, For, Match, Setter, Show, Switch } from 'solid-js';
import { unwrap } from 'solid-js/store';
import { getContext } from '../Context';
import { getLangKey, translatePage } from '../i18n';
import { findCentre } from '../util/geometry';
import { GuessStore } from '../util/stores';
import { formatKm } from '../util/text';
import Toggle from './Toggle';

type Props = {
  guesses: GuessStore;
  setPov: Setter<Coords | null>;
  ans: Country;
};

export default function (props: Props) {
  const context = getContext();
  const locale = context.locale().locale;
  const langKey = createMemo(() => getLangKey(locale));

  const [isSortedByDistance, toggleSortByDistance] = createSignal(true);

  function isAnswer(c: Country) {
    return c.properties.NAME === props.ans.properties.NAME;
  }

  const sortedGuesses = createMemo(() => {
    const list = isSortedByDistance()
      ? unwrap([...props.guesses.sorted])
      : unwrap([...props.guesses.countries]);
    const ans = list.find(isAnswer);
    if (ans) {
      return list.sort((a, z) => {
        if (isSortedByDistance()) {
          if (isAnswer(a)) return -1;
          if (isAnswer(z)) return 1;
        } else {
          if (isAnswer(a)) return 1;
          if (isAnswer(z)) return -1;
        }
        return 0;
      });
    }
    return list;
  });

  const isAlreadyShowingKm = context.distanceUnit().unit === 'km';
  const [isShowingKm, setShowingKm] = createSignal(isAlreadyShowingKm);

  createEffect(() => {
    if (props.guesses.length > 0) {
      translatePage();
    }
    isSortedByDistance();
    context.setDistanceUnit({ unit: isShowingKm() ? 'km' : 'miles' });
  });

  return (
    <div class="z-30 mb-16 py-8 dark:text-white">
      <Switch fallback={<p data-i18n="Game9">Guesses will appear here.</p>}>
        <Match when={props.guesses.length < 1}>
          <p>{i18next.t('Game9', 'Guesses will appear here.')}</p>
        </Match>
        <Match when={isSortedByDistance()}>
          <p>{i18next.t('Game12', 'Closest')}</p>
        </Match>
        <Match when={!isSortedByDistance()}>
          <p>{i18next.t('Game13', 'Guessed first')}</p>
        </Match>
      </Switch>
      <ul class="grid grid-cols-3 gap-3 md:grid-cols-4" data-cy="countries-list">
        <For each={sortedGuesses()}>
          {(country) => {
            const { NAME_LEN, ABBREV, NAME, FLAG } = country.properties;
            const flag = (FLAG || '').toLocaleLowerCase();
            let name = NAME_LEN >= 10 ? ABBREV : NAME;
            if (context.locale().locale !== 'en-CA') {
              name = country.properties[langKey()] as string;
            }
            return (
              <li>
                <button
                  onClick={() => props.setPov(findCentre(country))}
                  class="flex cursor-pointer items-center"
                >
                  <img src={`https://flagcdn.com/w20/${flag}.png`} alt={name} />
                  <span class="text-md ml-2 text-left">{name}</span>
                </button>
              </li>
            );
          }}
        </For>
      </ul>
      <Show when={props.guesses.length > 0}>
        <div class="mt-8">
          <div class="flex items-center space-x-1">
            <p>
              <span data-i18n="Game8">Closest border</span>:{' '}
              <span data-testid="closest-border">{formatKm(props.guesses.closest)}</span>
            </p>
            <Toggle
              setToggle={setShowingKm}
              toggleProp={isShowingKm}
              values={{
                on: { default: 'km', i18n: 'km' },
                off: { default: 'miles', i18n: 'miles' },
              }}
              gap={true}
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
                  <span class="text-md underline" data-i18n="SortByGuesses">
                    Sort by guesses
                  </span>
                </Match>
                <Match when={!isSortedByDistance()}>
                  <span class="text-md underline" data-i18n="SortByDistance">
                    Sort by distance
                  </span>
                </Match>
              </Switch>
            </button>
          </p>
        </div>
      </Show>
    </div>
  );
}
