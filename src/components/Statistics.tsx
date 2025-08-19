import dayjs from 'dayjs';
import { Accessor, createMemo, createSignal, onMount, Setter } from 'solid-js';
import Icon from './Icon';
import UAParser from 'ua-parser-js';
import { getContext } from '../Context';
import { translatePage } from '../i18n';
import i18next from 'i18next';
import TwlAd from './TwlAd';
import { createPracticeAns } from '../util/practice';

type Props = {
  showStats: Accessor<boolean>;
  setShowStats: Setter<boolean>;
};

export default function (props: Props) {
  const context = getContext();

  onMount(translatePage);

  const { gamesWon, lastWin, currentStreak, maxStreak, usedGuesses, emojiGuesses } =
    context.storedStats();

  const wonToday = createMemo(() => {
    const lastWin = dayjs(context.storedStats().lastWin);
    return lastWin.isSame(dayjs(), 'date');
  });

  const statsTable = createMemo(() => {
    const sumGuesses = usedGuesses.reduce((a, b) => a + b, 0);
    const avgGuesses = Math.round((sumGuesses / usedGuesses.length) * 100) / 100;
    const showAvgGuesses = usedGuesses.length === 0 ? '--' : avgGuesses;
    const todaysGuesses = wonToday() ? usedGuesses[usedGuesses.length - 1] : '--';

    const showLastWin = dayjs(lastWin).isAfter('2022-01-01')
      ? dayjs(lastWin).format('YYYY-MM-DD')
      : '--';

    const statsTable = [
      { label: 'Last win', value: showLastWin?.toString(), i18n: 'Stats1' },
      { label: "Today's guesses", value: todaysGuesses, i18n: 'Stats2' },
      { label: 'Games won', value: gamesWon, i18n: 'Stats3' },
      { label: 'Current streak', value: currentStreak, i18n: 'Stats4' },
      { label: 'Max streak', value: maxStreak, i18n: 'Stats5' },
      { label: 'Avg. guesses', value: showAvgGuesses, i18n: 'Stats7' },
    ];
    return statsTable;
  });

  const [showPrompt, setShowPrompt] = createSignal(false);
  const [promptType, setPromptType] = createSignal<ModalPrompt>('Message');
  const [promptText, setPromptText] = createSignal('');

  // Share score
  async function copyToClipboard() {
    const date = dayjs(lastWin);
    const sumGuesses = usedGuesses.reduce((a, b) => a + b, 0);
    const avgGuesses = Math.round((sumGuesses / usedGuesses.length) * 100) / 100;
    const showAvgGuesses = usedGuesses.length === 0 ? '--' : avgGuesses;
    const todaysGuesses = wonToday() ? usedGuesses[usedGuesses.length - 1] : '--';
    const shareString = `🌎 ${date.format('MMM D, YYYY')} 🌍
🔥 ${currentStreak} | Avg. Guesses: ${showAvgGuesses}
${wonToday() ? emojiGuesses : '--'} = ${todaysGuesses}

https://globle-game.com
#globle`;

    try {
      const parser = new UAParser();
      const isMobile = parser.getDevice().type === 'mobile';
      const isFirefox = parser.getBrowser().name === 'Firefox';
      setPromptType('Message');
      if ('canShare' in navigator && isMobile && !isFirefox) {
        await navigator.share({ title: 'Globle Stats', text: shareString });
        setPromptText('Shared!');
        setShowPrompt(true);
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareString);
        setPromptText('Copied!');
        setShowPrompt(true);
      } else {
        document.execCommand('copy', true, shareString);
        setPromptText('Copied!');
        setShowPrompt(true);
      }
    } catch (e) {
      setPromptText('This browser cannot share');
      setShowPrompt(true);
    }
  }

  function enterPractice() {
    createPracticeAns();
    window.location.href = '/practice';
    props.setShowStats(false);
  }

  return (
    <div class="min-w-[250px]">
      <button class="absolute top-3 right-4" onClick={() => props.setShowStats(false)}>
        <Icon shape="x" size={18} />
      </button>
      <h2
        class="font-header text-center text-3xl font-extrabold dark:text-gray-200"
        data-i18n="StatsTitle"
      >
        Statistics
      </h2>
      <table cell-padding="4rem" class="mx-auto w-full max-w-md dark:text-gray-200">
        <tbody>
          {statsTable().map((row) => {
            const cyLabel = row.label.toLowerCase().replace(/ /g, '-');
            return (
              <tr>
                <td class="border-b-2 border-dotted border-slate-700 pt-4 text-lg font-medium">
                  {i18next.t(row.i18n, row.label)}
                </td>
                <td
                  class="border-b-2 border-dotted border-slate-700 pt-4 text-center text-lg font-medium"
                  data-cy={cyLabel}
                >
                  {row.value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div class="flex w-full justify-around space-x-2 py-6">
        <button
          class="block rounded-md bg-blue-700 px-8 py-2 text-base font-medium text-white hover:bg-blue-900 focus:ring-2 focus:ring-blue-300 focus:outline-none dark:bg-purple-800 dark:text-gray-200 dark:hover:bg-purple-900"
          onClick={enterPractice}
          data-i18n="Settings9"
        >
          Play practice game
        </button>
        <button
          class="block justify-around rounded-md bg-blue-700 px-8 py-2 text-base font-medium text-white hover:bg-blue-900 focus:ring-2 focus:ring-blue-300 focus:outline-none disabled:bg-blue-400 dark:bg-purple-800 dark:text-gray-200 dark:hover:bg-purple-900 dark:disabled:bg-purple-900"
          onClick={copyToClipboard}
          disabled={!wonToday()}
          data-i18n="Stats9"
        >
          Share
        </button>
      </div>
      <TwlAd />
    </div>
  );
}
