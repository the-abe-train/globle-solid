import { useNavigate } from "@solidjs/router";
import dayjs from "dayjs";
import { Accessor, createMemo, createSignal, onMount, Setter } from "solid-js";
import Icon from "./Icon";
import Prompt from "./Prompt";
import UAParser from "ua-parser-js";
import { getContext } from "../Context";
import { translatePage } from "../i18n";
import i18next from "i18next";

type Props = {
  showStats: Accessor<boolean>;
  setShowStats: Setter<boolean>;
};

export default function (props: Props) {
  const navigate = useNavigate();
  const context = getContext();

  onMount(translatePage);

  const {
    gamesWon,
    lastWin,
    currentStreak,
    maxStreak,
    usedGuesses,
    emojiGuesses,
  } = context.storedStats();

  const wonToday = createMemo(() => {
    const lastWin = dayjs(context.storedStats().lastWin);
    return lastWin.isSame(dayjs(), "date");
  });

  const statsTable = createMemo(() => {
    const sumGuesses = usedGuesses.reduce((a, b) => a + b, 0);
    const avgGuesses =
      Math.round((sumGuesses / usedGuesses.length) * 100) / 100;
    const showAvgGuesses = usedGuesses.length === 0 ? "--" : avgGuesses;
    const todaysGuesses = wonToday()
      ? usedGuesses[usedGuesses.length - 1]
      : "--";

    const showLastWin = dayjs(lastWin).isAfter("2022-01-01")
      ? dayjs(lastWin).format("YYYY-MM-DD")
      : "--";

    const statsTable = [
      { label: "Last win", value: showLastWin?.toString(), i18n: "Stats1" },
      { label: "Today's guesses", value: todaysGuesses, i18n: "Stats2" },
      { label: "Games won", value: gamesWon, i18n: "Stats3" },
      { label: "Current streak", value: currentStreak, i18n: "Stats4" },
      { label: "Max streak", value: maxStreak, i18n: "Stats5" },
      { label: "Avg. guesses", value: showAvgGuesses, i18n: "Stats7" },
    ];
    return statsTable;
  });

  // Prompt
  const [showPrompt, setShowPrompt] = createSignal(false);
  const [promptType, setPromptType] = createSignal<Prompt>("Choice");
  const [promptText, setPromptText] = createSignal("");

  function promptResetStats() {
    setPromptText("Are you sure you want to reset your score?");
    setPromptType("Choice");
    setShowPrompt(true);
  }

  function triggerResetStats() {
    context.resetGuesses();
    context.resetStats();
    setPromptType("Message");
    setPromptText("Stats reset.");
    setTimeout(() => {
      props.setShowStats(false);
      navigate("/");
    }, 2000);
  }

  // Share score
  async function copyToClipboard() {
    const date = dayjs(lastWin);
    const sumGuesses = usedGuesses.reduce((a, b) => a + b, 0);
    const avgGuesses =
      Math.round((sumGuesses / usedGuesses.length) * 100) / 100;
    const showAvgGuesses = usedGuesses.length === 0 ? "--" : avgGuesses;
    const todaysGuesses = wonToday()
      ? usedGuesses[usedGuesses.length - 1]
      : "--";
    const shareString = `🌎 ${date.format("MMM D, YYYY")} 🌍
🔥 ${currentStreak} | Avg. Guesses: ${showAvgGuesses}
${wonToday() ? emojiGuesses : "--"} = ${todaysGuesses}

globle-capitals.com
#globle #capitals`;

    try {
      const parser = new UAParser();
      const isMobile = parser.getDevice().type === "mobile";
      const isFirefox = parser.getBrowser().name === "Firefox";
      setPromptType("Message");
      if ("canShare" in navigator && isMobile && !isFirefox) {
        await navigator.share({ title: "Plurality Stats", text: shareString });
        setPromptText("Shared!");
        setShowPrompt(true);
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareString);
        setPromptText("Copied!");
        setShowPrompt(true);
      } else {
        document.execCommand("copy", true, shareString);
        setPromptText("Copied!");
        setShowPrompt(true);
      }
    } catch (e) {
      setPromptText("This browser cannot share");
      setShowPrompt(true);
    }
  }

  return (
    <div class="min-w-[250px]">
      <button
        class="absolute top-3 right-4"
        onClick={() => props.setShowStats(false)}
      >
        <Icon shape="x" size={18} />
      </button>
      <h2
        class="text-3xl text-center font-extrabold font-header dark:text-gray-200"
        data-i18n="StatsTitle"
      >
        Statistics
      </h2>
      <table
        cell-padding="4rem"
        class="mx-auto dark:text-gray-200 w-full max-w-md"
      >
        <tbody>
          {statsTable().map((row) => {
            const cyLabel = row.label.toLowerCase().replace(/ /g, "-");
            return (
              <tr>
                <td
                  class="pt-4 border-b-2 border-dotted border-slate-700 
                text-lg font-medium"
                  // data-cy={row.i18n}
                >
                  {i18next.t(row.i18n, row.label)}
                </td>
                <td
                  class="pt-4 border-b-2 border-dotted border-slate-700 
                text-lg font-medium text-center"
                  data-cy={cyLabel}
                >
                  {row.value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div class="py-6 flex w-full justify-around">
        <button
          class="text-red-700 border-red-700 border rounded-md px-6 py-2 block
          text-base font-medium hover:bg-red-700 hover:text-gray-300
          focus:outline-none focus:ring-2 focus:ring-red-300 sm:mx-4
          dark:text-red-500 dark:border-red-500 dark:disabled:border-red-400
          dark:hover:bg-red-500 dark:hover:text-black"
          onClick={promptResetStats}
          data-i18n="Stats8"
        >
          Reset
        </button>
        <button
          class="bg-blue-700 hover:bg-blue-900 dark:bg-purple-800 dark:hover:bg-purple-900
          disabled:bg-blue-400 dark:disabled:bg-purple-900
          text-white dark:text-gray-200 rounded-md px-8 py-2 block text-base font-medium 
          focus:outline-none focus:ring-2 focus:ring-blue-300 
          justify-around sm:flex-grow sm:mx-10"
          onClick={copyToClipboard}
          disabled={!wonToday()}
          data-i18n="Stats9"
        >
          Share
        </button>
      </div>
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
