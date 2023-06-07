import { createMemo } from "solid-js";
import UAParser from "ua-parser-js";
import forgeousLogo from "../images/other-games/forgeous-logo.png";
import chronogramLogo from "../images/other-games/chronogram-logo.png";
import globleCapitalsLogo from "../images/other-games/globle-capitals-logo.png";
import pluralityLogo from "../images/other-games/plurality-logo.png";
import externalIcon from "../images/other-games/external.svg";

export default function () {
  const parser = new UAParser();
  const isMobile = parser.getDevice().type === "mobile";

  const games = [
    {
      name: "Forgeous",
      style: "text-2xl ml-1 mt-1 mr-2",
      url: "https://forgeous.fun",
      font: "Mogra",
      logo: forgeousLogo,
      bg: "bg-stone-50",
      weight: isMobile ? 2 : 0,
    },
    {
      name: "Chronogram",
      style: "text-2xl ml-1 mr-2",
      url: "https://chronogram.chat",
      font: "Zilla Slab",
      logo: chronogramLogo,
      bg: "bg-stone-50",
      weight: 5,
    },
    {
      name: "GLOBLE: CAPITALS",
      style: "text-xl mt-1 ml-1 mr-2 font-bold",
      url: "https://globle-capitals.com",
      font: "Montserrat",
      logo: globleCapitalsLogo,
      bg: "bg-sky-50",
      weight: 1,
    },
    {
      name: "Plurality",
      style: "text-2xl ml-1 mr-2 font-bold",
      url: "https://www.plurality.fun",
      font: "Amaranth",
      logo: pluralityLogo,
      bg: "bg-orange-50",
      weight: 2,
    },
  ];

  function pickWeightedRandomGame() {
    const weights = games.map((game) => game.weight);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let chosenIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random < 0) {
        chosenIndex = i;
        break;
      }
    }
    return games[chosenIndex];
  }

  const game = createMemo(() => pickWeightedRandomGame());

  return (
    <div>
      <p class="dark:text-gray-200  mt-1 text-center">
        Play another game from{" "}
        <a href="https://trainwrecklabs.com" class="underline">
          Trainwreck Labs
        </a>
        !
      </p>
      <a href={game().url} class="w-max mx-auto block p-2">
        <button
          class={`rounded ${game().bg} flex border border-stone-500 
    px-2 py-1 items-center`}
        >
          <img
            src={game().logo}
            alt="Logo"
            width={25}
            height={20}
            class="h-max"
          />
          <span class={game().style} style={{ "font-family": game().font }}>
            {game().name}
          </span>
          <img src={externalIcon} alt="External" width={15} />
        </button>
      </a>
    </div>
  );
}
