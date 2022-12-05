import { useNavigate } from "@solidjs/router";
import dayjs from "dayjs";
import { Accessor, createMemo, createSignal, onMount, Setter } from "solid-js";
import Icon from "./Icon";
import Prompt from "./Prompt";
import UAParser from "ua-parser-js";
import { getContext } from "../Context";
import { translatePage } from "../i18n";
import i18next from "i18next";
import plurality from "../images/plurality.png";

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

globle-game.com
#globle`;

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
      <h3
        class="text-md text-center font-extrabold dark:text-gray-200 mb-2"
        style={{ "font-family": "'Montserrat'" }}
      >
        New game from the creator of Globle!
      </h3>
      <div class="w-full flex justify-center">
        <button
          class="rounded-md px-4 py-2 text-xl font-bold mx-auto my-2
          border text-[#2b1628] border-[#2b1628] bg-[#FFEAE0] "
          style={{ "font-family": "Amaranth" }}
        >
          <a
            href="https://plurality.fun"
            class="flex items-center mx-auto"
            rel="strict-origin noopener"
            target="_blank"
          >
            <img src={plurality} alt="Plurality logo" width={25} height={25} />
            <span class="ml-1 mr-3">Plurality</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13 8.33333V11.6667C13 12.0203 12.8595 12.3594 12.6095 12.6095C12.3594 12.8595 12.0203 13 11.6667 13H2.33333C1.97971 13 1.64057 12.8595 1.39052 12.6095C1.14048 12.3594 1 12.0203 1 11.6667V2.33333C1 1.97971 1.14048 1.64057 1.39052 1.39052C1.64057 1.14048 1.97971 1 2.33333 1H5.66667M8 6L13 1L8 6ZM9.66667 1H13V4.33333L9.66667 1Z"
                stroke="#2b1628"
                stroke-width="1.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </a>
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
