import { createSignal, onMount, Show } from 'solid-js';
import { isMobile } from '../util/globe';
import abrakadaverLogo from '../images/other-games/abrakadaver-icon.svg';
import bonedoggleLogo from '../images/other-games/bonedoggle-icon.svg';
import forgeousLogo from '../images/other-games/forgeous-logo.png';
import chronogramLogo from '../images/other-games/chronogram-logo.png';
import metazooaLogo from '../images/other-games/metazooa-logo.png';
import externalIcon from '../images/other-games/external.svg';
import linxiconLogo from '../images/other-games/linxicon-logo.png';
import elemingleLogo from '../images/other-games/elemingle-logo.png';
import { useGoogleFont } from '../util/fonts';
import globleCapitalsLogo from '../images/other-games/globle-capitals-logo.png';
import globleLogo from '../images/no-bg-logos/globle.png';
import { t } from '../i18n';

type TwlAdGame = {
  name: string;
  style: string;
  url: string;
  font: string;
  logo: string;
  bg: string;
  weight: number;
  fontWeight?: number;
  textColor?: string;
  labelOffsetY?: string;
  buttonPadding?: string;
  contentGap?: string;
};

export default function () {
  // Match the primary, same-family, and mobile weights in twl-monorepo.
  const games: TwlAdGame[] = [
    {
      name: 'Abrakadaver',
      style: 'text-2xl',
      url: 'https://abrakadaver.com',
      font: 'Special Elite',
      logo: abrakadaverLogo,
      bg: '#281920',
      textColor: '#e8f6f7',
      labelOffsetY: '0.1em',
      buttonPadding: '0.75rem 1.25rem',
      contentGap: '1rem',
      weight: 4,
    },
    {
      name: 'Bonedoggle',
      style: 'text-2xl',
      url: 'https://bonedoggle.com',
      font: 'Special Elite',
      logo: bonedoggleLogo,
      bg: '#2c212a',
      textColor: '#ede4d3',
      labelOffsetY: '0.1em',
      buttonPadding: '0.75rem 1.25rem',
      contentGap: '1rem',
      weight: 4,
    },
    {
      name: 'Chronogram',
      style: 'text-2xl ml-1 mr-2',
      url: 'https://chronogram.chat',
      font: 'Zilla Slab',
      logo: chronogramLogo,
      bg: '#FDF8F0',
      weight: 1,
    },
    {
      name: 'Elemingle',
      style: 'text-2xl ml-1 mr-2',
      url: 'https://elemingle.com',
      font: 'Patrick Hand',
      logo: elemingleLogo,
      bg: '#F3F7FB',
      weight: 1,
    },
    {
      name: 'Forgeous',
      style: 'text-2xl ml-1 mr-2',
      url: 'https://forgeous.fun',
      font: 'Mogra',
      logo: forgeousLogo,
      bg: '#FAFAF9',
      weight: isMobile() ? 0.5 : 0,
    },
    {
      name: 'GLOBLE: CAPITALS',
      style: 'text-2xl ml-1 mr-2',
      url: 'https://globle-capitals.com',
      font: 'Montserrat',
      logo: globleCapitalsLogo,
      bg: '#F0F9FF',
      fontWeight: 400,
      weight: 4,
    },
    {
      name: 'GLOBLE: LEAGUES',
      style: 'text-2xl ml-1 mr-2',
      url: 'https://globle-leagues.com',
      font: 'Montserrat',
      logo: globleLogo,
      bg: '#F0F9FF',
      fontWeight: 400,
      weight: 4,
    },
    {
      name: 'Linxicon',
      style: 'text-2xl ml-1 mr-2',
      url: 'https://linxicon.com',
      font: 'McLaren',
      logo: linxiconLogo,
      bg: '#F9F8F5',
      weight: 1,
    },
    {
      name: 'Metazooa',
      style: 'text-2xl ml-1 mr-2',
      url: 'https://metazooa.com',
      font: 'Gluten',
      logo: metazooaLogo,
      bg: '#F0FDF4',
      weight: 1,
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

  // Select after mount so hydration uses one consistent name, URL, and theme.
  const [game, setGame] = createSignal<TwlAdGame>();
  onMount(() => setGame(pickWeightedRandomGame()));
  useGoogleFont(() => {
    const selectedGame = game();
    if (!selectedGame) return;
    return selectedGame.fontWeight
      ? `${selectedGame.font}:wght@${selectedGame.fontWeight}`
      : selectedGame.font;
  });

  return (
    <Show when={game()} keyed>
      {(selectedGame) => (
        <div>
          <p class="mt-1 text-center dark:text-gray-200">
            <span data-i18n="TWL10">{t('TWL10', 'Play another game from')}</span>{' '}
            <a href="https://trainwrecklabs.com" class="underline">
              Trainwreck Labs
            </a>
            !
          </p>
          <form
            action={selectedGame.url}
            class="mx-auto block w-max p-2 text-black"
            target="_blank"
          >
            <input type="text" hidden name="utm_medium" value="game" />
            <input type="text" hidden name="utm_source" value="globle" />
            <input type="text" hidden name="utm_campaign" value="backlinks" />
            <button
              class="flex items-center rounded border border-stone-500 px-2 py-1"
              style={{
                background: selectedGame.bg,
                color: selectedGame.textColor,
                padding: selectedGame.buttonPadding,
                gap: selectedGame.contentGap,
              }}
              type="submit"
            >
              <img
                src={selectedGame.logo}
                alt="Logo"
                width={25}
                height={20}
                class="shrink-0 object-contain"
              />
              <span
                class={selectedGame.style}
                style={{
                  'font-family': selectedGame.font,
                  'font-weight': selectedGame.fontWeight,
                  'line-height': selectedGame.labelOffsetY ? '1' : undefined,
                  transform: selectedGame.labelOffsetY
                    ? `translateY(${selectedGame.labelOffsetY})`
                    : undefined,
                }}
              >
                {selectedGame.name}
              </span>
              <img
                src={externalIcon}
                alt="External"
                width={15}
                style={selectedGame.textColor ? { filter: 'invert(1)' } : undefined}
              />
            </button>
          </form>
        </div>
      )}
    </Show>
  );
}
