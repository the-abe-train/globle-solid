import { createEffect, createSignal, onMount, Suspense, Setter } from 'solid-js';
import Toggle from '../components/Toggle';
import { getContext } from '../Context';
import { useNavigate, useSearchParams } from '@solidjs/router';
import SelectMenu from '../components/SelectMenu';
import { langMap, translate, translatePage } from '../i18n';
import NavGlobe from '../components/globes/NavGlobe';
import { createPracticeAns } from '../util/practice';
import { subscribeToNewsletter } from '../util/newsletter';
import { getColourScheme, translateColourScheme, untranslateColourScheme } from '../util/colour';
import TwlAccount from '../components/Twl/TwlAccount';
import { combineStats, getAcctStats } from '../util/stats';
import Prompt from '../components/Prompt';
import { MONGO_GATEWAY_BASE, withGatewayHeaders } from '../util/api';

export default function () {
  const context = getContext();
  const navigate = useNavigate();

  const isAlreadyDark = context.theme().isDark;
  const [isDark, setDark] = createSignal(isAlreadyDark);
  // Persist theme changes immediately to avoid races on navigation
  const setDarkAndPersist: Setter<boolean> = (value: boolean | ((prev: boolean) => boolean)) => {
    const next =
      typeof value === 'function' ? (value as (prev: boolean) => boolean)(isDark()) : value;
    setDark(next);
    context?.setTheme({ isDark: next });
    return next;
  };

  const labelsAlreadyOn = context.labelsOn().labelsOn;
  const [labelsOn, setLabelsOn] = createSignal(labelsAlreadyOn);
  createEffect(() => context?.setLabelsOn({ labelsOn: labelsOn() }));

  const currentLocale = context.locale().locale;
  const [locale, setLocale] = createSignal(currentLocale);
  createEffect(() => {
    context?.setLocale({ locale: locale() });
    translatePage();
  });

  const currentColours = context.colours().colours;
  const currentColoursTranslated = translateColourScheme(currentColours);
  const [colours, setColours] = createSignal(currentColours);
  createEffect(() => {
    context?.setColours({ colours: colours() });
  });
  const schemesList = Object.entries(getColourScheme(isDark(), true)).map(([key, _value]) => {
    return { name: key, value: untranslateColourScheme(key) };
  });

  // Get email from search params after Discord sign in
  const [searchParams] = useSearchParams();
  const email = searchParams.email || context.user().email;
  const isNewDiscordSignIn = searchParams.email && typeof searchParams.email === 'string';

  if (email && typeof email === 'string') {
    context.setUser({ email });
    // Subscribe to newsletter if user opted in (for Discord auth)
    subscribeToNewsletter(email);

    // If this is a new Discord sign-in (email came from URL params), sync stats immediately
    if (isNewDiscordSignIn) {
      console.log('Discord sign-in successful - syncing stats immediately');
      (async () => {
        try {
          const accountStats = await getAcctStats(context);
          if (typeof accountStats !== 'string') {
            const localStats = context.storedStats();
            if (localStats.gamesWon === 0) {
              console.log('Local stats empty - using account stats from Discord sign-in');
              context.storeStats(accountStats);
            } else {
              console.log('Combining local and account stats after Discord sign-in');
              const combinedStats = combineStats(localStats, accountStats);
              context.storeStats(combinedStats);
            }
            console.log('Stats synced successfully after Discord sign-in');
          } else {
            console.error('Failed to sync stats after Discord sign-in:', accountStats);
          }
        } catch (error) {
          console.error('Error syncing stats after Discord sign-in:', error);
        }
      })();
    }
  }

  function enterPractice1() {
    createPracticeAns();
    navigate('/practice');
  }

  onMount(async () => {
    // If connected, fetch backup
    try {
      if (email) {
        console.log('Settings mounted - syncing stats for:', email);
        const accountStats = await getAcctStats(context);
        if (typeof accountStats === 'string') {
          console.error('Failed to fetch account stats in Settings:', accountStats);
          // Don't sync if we can't fetch - keep local stats
          return;
        }
        const localStats = context.storedStats();

        if (localStats.gamesWon === 0) {
          console.log('Local stats empty - using account stats');
          context.storeStats(accountStats);
        } else {
          // Combine local and account stats
          console.log('Combining local and account stats');
          const combinedStats = combineStats(localStats, accountStats);
          context.storeStats(combinedStats);

          // Store combined stats in account
          const email = context.user().email;
          const endpoint = `${MONGO_GATEWAY_BASE}/account?email=${encodeURIComponent(email)}`;
          console.log('Sending combined stats to database');
          const response = await fetch(
            endpoint,
            withGatewayHeaders({
              method: 'PUT',
              body: JSON.stringify(combinedStats),
            }),
          );

          if (!response.ok) {
            console.error('Failed to save combined stats to database:', response.status);
          } else {
            console.log('Successfully saved combined stats to database');
          }
        }
      }
    } catch (e) {
      console.error('Failed to combine local and account stats:', e);
    }
  });
  // Add reset stats functionality
  const [showPrompt, setShowPrompt] = createSignal(false);
  const [promptType, setPromptType] = createSignal<ModalPrompt>('Choice');
  const [promptText, setPromptText] = createSignal('');

  function promptResetStats() {
    // setPromptText("Are you sure you want to reset your score?");
    setPromptText(translate('Stats10', 'Are you sure you want to reset your score?'));
    setPromptType('Choice');
    setShowPrompt(true);
  }

  function triggerResetStats() {
    context.resetGuesses();
    const emptyStats = context.resetStats();
    // Store new stats in account
    const email = context.user().email;
    if (email) {
      const endpoint = `${MONGO_GATEWAY_BASE}/account?email=${encodeURIComponent(email)}`;
      fetch(
        endpoint,
        withGatewayHeaders({
          method: 'PUT',
          body: JSON.stringify(emptyStats),
        }),
      );
    }
    setPromptType('Message');
    setPromptText('Stats reset.');
    setTimeout(() => {
      setShowPrompt(false);
    }, 2000);
  }

  console.log(`Colours: ${colours()}`);

  return (
    <div class="space-y-10">
      <div class="space-y-5">
        <h2 class="font-header my-5 text-center text-2xl font-extrabold" data-i18n="SettingsTitle">
          Settings
        </h2>
        <div class="mx-auto max-w-xs space-y-3">
          <Toggle
            setToggle={setDarkAndPersist}
            toggleProp={isDark}
            values={{
              on: { default: 'Night', i18n: 'Settings2' },
              off: { default: 'Day', i18n: 'Settings1' },
            }}
          />
          <Toggle
            setToggle={setLabelsOn}
            toggleProp={labelsOn}
            values={{
              on: { default: 'Labels on', i18n: 'Settings13' },
              off: { default: 'Labels off', i18n: 'Settings14' },
            }}
          />
          <SelectMenu
            name="Language"
            i18n="Settings7"
            choice={locale}
            choose={setLocale}
            list={langMap.map((lang) => ({
              name: lang.name,
              value: lang.locale,
            }))}
          />
          <SelectMenu
            // Keep a stable name attribute for tests/selectors; label still translated inside component
            name={'Colours'}
            i18n="Settings12"
            choice={colours}
            choose={setColours}
            list={schemesList}
          />
        </div>
        <div class="flex justify-center space-x-20 py-4">
          <button
            onClick={enterPractice1}
            data-cy="practice-link"
            data-i18n="Settings9"
            class="block items-center justify-center self-center rounded-lg bg-blue-700 px-4 py-2.5 text-center text-sm text-white hover:bg-blue-900 focus:ring-4 focus:ring-blue-300 disabled:bg-blue-900 dark:bg-purple-800 dark:hover:bg-purple-900"
          >
            Play practice game
          </button>
          <button
            class="block rounded-md border border-red-700 px-6 py-2 text-base font-medium text-red-700 hover:bg-red-700 hover:text-gray-300 focus:ring-2 focus:ring-red-300 focus:outline-none dark:border-red-500 dark:text-red-500 dark:hover:bg-red-500 dark:hover:text-black dark:disabled:border-red-400"
            onClick={promptResetStats}
            data-i18n="Stats8"
          >
            Reset
          </button>
        </div>
      </div>
      <TwlAccount />
      <Suspense fallback={<p data-i18n="Loading">Loading...</p>}>
        <NavGlobe />
      </Suspense>
      <Prompt
        showPrompt={showPrompt}
        setShowPrompt={setShowPrompt}
        promptType={promptType()}
        text={promptText()}
        yes={triggerResetStats}
      />
    </div>
  );
}
