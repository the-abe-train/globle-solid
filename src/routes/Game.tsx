import dayjs from 'dayjs';
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
} from 'solid-js';
import Guesser from '../components/Guesser';
import List from '../components/List';
import { getAnswer } from '../util/encryption';
import { getContext } from '../Context';
import { getCountry, getTerritories } from '../util/data';
import { polygonDistance } from '../util/geometry';
import { translatePage } from '../i18n';
import { createGuessStore } from '../util/stores';
import NitroPayAd from '../components/NitroPayAd';
import { addGameToStats, combineStats, getAcctStats } from '../util/stats';
import { DAILY_STATS_ENDPOINT, MONGO_GATEWAY_BASE, withGatewayHeaders } from '../util/api';

const GameGlobe = lazy(() => import('../components/globes/GameGlobe'));

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
        country['proximity'] = proximity;
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
      (c) => c.properties.NAME === props.ans.properties.NAME,
    );
    if (winningGuess) setWin(true);
  });

  onMount(async () => {
    translatePage();
    const expiration = dayjs(context.storedGuesses().day);
    if (dayjs().isAfter(expiration)) context.resetGuesses();

    // Sync stats on page load for logged-in users
    const email = context.user().email;
    if (email) {
      console.log('Game page loaded - syncing stats for logged-in user');
      try {
        const accountStats = await getAcctStats(context);
        if (typeof accountStats !== 'string') {
          const localStats = context.storedStats();
          const combinedStats = combineStats(localStats, accountStats);
          console.log('Synced stats on game page load:', combinedStats);
          context.storeStats(combinedStats);
        } else {
          console.warn('Failed to sync stats on game page load:', accountStats);
        }
      } catch (error) {
        console.error('Error syncing stats on game page load:', error);
      }
    }

    // If game is already won, show stats modal
    if (win()) {
      setTimeout(() => {
        props.setShowStats(true);
      }, 3000);
    }
  });

  // When the player wins!
  createEffect(
    on(win, async () => {
      console.log('Running win effect');
      // Sync local storage with account
      const email = context.user().email;
      const accountEndpoint = `${MONGO_GATEWAY_BASE}/account?email=${encodeURIComponent(email)}`;
      // Add new game to stats
      const today = dayjs(); // TODO should be using the time from when the game started, not the time when the game ends
      const answer = props.ans;
      console.log('Player won, updating stats');
      if (win() && answer) {
        let currentStats = context.storedStats();
        // First, sync with account stats if user is logged in
        if (email) {
          const accountStats = await getAcctStats(context);
          if (typeof accountStats !== 'string') {
            const combinedStats = combineStats(currentStats, accountStats);
            console.log('Storing combined stats', combinedStats);
            currentStats = combinedStats;
          } else {
            // Log the error but continue with local stats
            console.warn('Failed to fetch account stats on win:', accountStats);
            console.warn('Continuing with local stats only. Stats may be out of sync.');
          }
        }
        // Then add the current game win to the stats
        console.log('Storing new game stats locally');
        const newStats = addGameToStats(currentStats, guesses.countries, props.ans);
        console.log("Storing final stats with today's win", newStats);
        context.storeStats(newStats);
        // Store new stats in account
        if (email) {
          console.log('Sending PUT request to account endpoint for:', email);
          fetch(
            accountEndpoint,
            withGatewayHeaders({
              method: 'PUT',
              body: JSON.stringify({
                ...newStats,
                lastWin: new Date(newStats.lastWin).toISOString(),
              }),
            }),
          )
            .then((response) => {
              if (response.ok) {
                console.log('Successfully updated account stats');
              } else {
                console.error(
                  'Failed to update account stats:',
                  response.status,
                  response.statusText,
                );
              }
            })
            .catch((error) => {
              console.error('Error updating account stats:', error);
            });
        } else {
          console.log('No email found, skipping account stats update');
        }
        // Show stats
        setTimeout(() => props.setShowStats(true), 2000);

        // Update the daily stats
        if (email) {
          let guessesNames = guesses.countries.map((c) => c.properties.NAME);
          if (guessesNames.length === 0) {
            guessesNames = context.storedGuesses().countries;
          }
          const dailyStatsBody = {
            date: today.format('YYYY-MM-DD'),
            email,
            guesses: guessesNames,
            answer: props.ans.properties.NAME,
            win: true,
          };
          try {
            fetch(
              DAILY_STATS_ENDPOINT,
              withGatewayHeaders({
                method: 'PUT',
                body: JSON.stringify(dailyStatsBody),
              }),
            );
          } catch (e) {
            console.error('Error storing daily stats', e);
          }
        }
      }
    }),
  );

  function addNewGuess(newGuess: Country) {
    const territories = getTerritories(newGuess);
    setGuesses('places', (prev) => [...prev, newGuess, ...territories]);
    const countryName = newGuess.properties.NAME;
    context.storeGuesses((prev) => {
      return { ...prev, countries: [...prev.countries, countryName] };
    });
    const email = context.user().email;
    if (email) {
      let guessNames = guesses.countries.map((c) => c.properties.NAME);
      if (guessNames.length === 0) {
        guessNames = context.storedGuesses().countries;
      }
      try {
        // Update daily stats
        fetch(
          DAILY_STATS_ENDPOINT,
          withGatewayHeaders({
            method: 'PUT',
            body: JSON.stringify({
              date: dayjs().format('DD-MM-YYYY'),
              email,
              guesses: guessNames,
              answer: props.ans.properties.NAME,
              win: win(),
            }),
          }),
        ).then((res) => {
          if (res.ok) {
            console.log('Daily stats stored');
          }
        });

        // Also sync account stats to keep them up to date
        const accountEndpoint = `${MONGO_GATEWAY_BASE}/account?email=${encodeURIComponent(email)}`;
        const currentStats = context.storedStats();
        fetch(
          accountEndpoint,
          withGatewayHeaders({
            method: 'PUT',
            body: JSON.stringify(currentStats),
          }),
        );
      } catch (e) {
        console.error('Error storing daily stats', e);
      }
    }
  }

  return (
    <div>
      <Guesser addGuess={addNewGuess} guesses={guesses} win={win} ans={props.ans} />
      <Suspense fallback={<p data-i18n="Loading">Loading...</p>}>
        <GameGlobe guesses={guesses} pov={pov} ans={props.ans} />
      </Suspense>
      <List guesses={guesses} setPov={setPov} ans={props.ans} />
      <NitroPayAd />
    </div>
  );
}
