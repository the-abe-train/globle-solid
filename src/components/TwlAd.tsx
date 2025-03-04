import { createMemo } from "solid-js";
import UAParser from "ua-parser-js";
import forgeousLogo from "../images/other-games/forgeous-logo.png";
import chronogramLogo from "../images/other-games/chronogram-logo.png";
import globleCapitalsLogo from "../images/other-games/globle-capitals-logo.png";
import metazooaLogo from "../images/other-games/metazooa-logo.png";
import externalIcon from "../images/other-games/external.svg";
import linxiconLogo from "../images/other-games/linxicon-logo.png";
import globleLogo from "../images/no-bg-logos/globle.png";
import elemingleLogo from "../images/other-games/elemingle-logo.png";
import { translate } from "../i18n";

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
      weight: isMobile ? 1 : 0,
    },
    {
      name: "Chronogram",
      style: "text-2xl ml-1 mr-2",
      url: "https://chronogram.chat",
      font: "Zilla Slab",
      logo: chronogramLogo,
      bg: "bg-stone-50",
      weight: 2,
    },
    {
      name: "GLOBLE: CAPITALS",
      style: "text-xl mt-1 ml-1 mr-2 font-bold",
      url: "https://globle-capitals.com",
      font: "Montserrat",
      logo: globleCapitalsLogo,
      bg: "bg-sky-50",
      weight: 4,
    },
    {
      name: "GLOBLE: LEAGUES",
      style: "text-xl mt-1 ml-1 mr-2 font-bold",
      url: "https://globle-leagues.com",
      font: "Montserrat",
      logo: globleLogo,
      bg: "bg-sky-50",
      weight: 4,
    },
    {
      name: "Metazooa",
      style: "text-2xl mt-1 ml-1 mr-2",
      url: "https://metazooa.com",
      font: "Gluten",
      logo: metazooaLogo,
      bg: "bg-green-50",
      weight: 3,
    },
    {
      name: "Linxicon",
      style: "text-2xl ml-1 mr-2",
      url: "https://linxicon.com",
      font: "McLaren",
      bg: "bg-stone-50",
      logo: linxiconLogo,
      weight: 2,
    },
    {
      name: "Elemingle",
      style: "text-2xl mt-1 ml-1 mr-2",
      url: "https://elemingle.com",
      font: "Patrick Hand",
      bg: "bg-cyan-50",
      logo: elemingleLogo,
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
        <span data-i18n="TWL10">
          {translate("TWL10", "Play another game from")}
        </span>{" "}
        <a href="https://trainwrecklabs.com" class="underline">
          Trainwreck Labs
        </a>
        !
      </p>
      <form action={game().url} class="w-max mx-auto block p-2" target="_blank">
        <input type="text" hidden name="utm_medium" value="game" />
        <input type="text" hidden name="utm_source" value="globle" />
        <input type="text" hidden name="utm_campaign" value="backlinks" />
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
      </form>
    </div>
  );
}
