import { A } from "@solidjs/router";
import { Accessor, Setter, Show } from "solid-js";
import Icon from "./Icon";

type Props = {
  showStats: Accessor<boolean>;
  setShowStats: Setter<boolean>;
};

export default function Header({ showStats, setShowStats }: Props) {
  const toggleStats = () => {
    setShowStats(!showStats());
  };

  return (
    <header class="pt-6 h-14 relative dark:text-gray-200 z-10">
      <div class="relative h-full">
        <div class="flex absolute left-0 bottom-1">
          <A href="/" aria-label="help" data-cy="home-link">
            <Icon shape="help" size={24} />
          </A>
        </div>
        <A
          class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-max"
          href="/game"
          data-cy="game-link"
        >
          <h1
            class="text-2xl sm:text-3xl font-extrabold font-header w-min 
          sm:w-max text-center"
          >
            GLOBLE: CAPITALS
          </h1>
        </A>
        <div class="space-x-1 flex absolute right-0 bottom-1">
          <Show when={!showStats()} fallback={<Icon shape="stats" size={24} />}>
            <button aria-label="Statistics" onClick={toggleStats}>
              <Icon shape="stats" size={24} />
            </button>
          </Show>
          <button aria-label="Settings">
            <A href="/settings" aria-label="settings" data-cy="settings-link">
              <Icon shape="settings" size={24} />
            </A>
          </button>
        </div>
      </div>
      <hr class="bottom-0 border-black dark:border-gray-200" />
    </header>
  );
}
