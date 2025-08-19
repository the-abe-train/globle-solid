import { Accessor, Setter, Show } from 'solid-js';
import globleLogo from '../images/no-bg-logos/globle.png';
import capitalsLogo from '../images/no-bg-logos/capitals.png';
import Icon from './Icon';

type Props = {
  showStats: Accessor<boolean>;
  setShowStats: Setter<boolean>;
};

export default function Header({ showStats, setShowStats }: Props) {
  const toggleStats = () => {
    setShowStats(!showStats());
  };

  return (
    <header class="relative z-10 h-14 pt-6 dark:text-gray-200">
      <div class="relative h-full">
        <div class="absolute bottom-1 left-0 flex space-x-3">
          <a href="/" aria-label="help" data-cy="home-link">
            <img
              src={globleLogo}
              alt="Globle"
              width={25}
              height={20}
              class="h-max"
              style={{ filter: 'saturate(0.8)' }}
            />
          </a>
          <a
            href="https://globle-capitals.com?utm_source=globle&utm_medium=referral"
            target="_blank"
            rel="noreferrer"
            aria-label="help"
            data-cy="home-link"
          >
            <img
              src={capitalsLogo}
              alt="Globle: Capitals"
              width={25}
              height={20}
              class="h-max dark:invert"
              // style={{ filter: "saturate(0.8)" }}
            />
          </a>
        </div>
        <a
          class="absolute bottom-0 left-1/2 w-max -translate-x-1/2 transform"
          href="/game"
          data-cy="game-link"
        >
          <h1 class="font-header w-min text-center text-3xl font-extrabold sm:w-max">GLOBLE</h1>
        </a>
        <div class="absolute right-0 bottom-1 flex space-x-1">
          <Show when={!showStats()} fallback={<Icon shape="stats" size={24} />}>
            <button aria-label="Statistics" onClick={toggleStats}>
              <Icon shape="stats" size={24} />
            </button>
          </Show>
          <button aria-label="Settings">
            <a href="/settings" aria-label="settings" data-cy="settings-link">
              <Icon shape="settings" size={24} />
            </a>
          </button>
        </div>
      </div>
      <hr class="bottom-0 border-black dark:border-gray-200" />
    </header>
  );
}
