import Icon from './Icon';
import trainwreckWhite from '../images/trainwreck-white.svg';
import trainwreckBlack from '../images/trainwreck-black.svg';
import { onMount } from 'solid-js';
import VersionDisplay from './VersionDisplay';

declare global {
  interface Window {
    __uspapi?: (command: string, version: number) => void;
    __cmp?: (command: string) => void;
  }
}

export default function Footer() {
  onMount(() => {
    if (window.__uspapi) {
      window.__uspapi('addLink', 1);
    }
    if (window['__cmp']) {
      window['__cmp']('addConsentLink');
    }
  });
  return (
    <footer class="mb-24 flex w-full flex-grow items-end justify-between gap-8 pt-8 pb-4 text-xs sm:px-0">
      <div class="flex flex-col gap-3">
        <a
          href="https://trainwrecklabs.com"
          data-i18n="Footer1"
          class="flex items-center transition-opacity hover:opacity-80"
        >
          <span>by Trainwreck Labs</span>
          <img
            src={trainwreckBlack}
            width={14}
            height={14}
            class="mx-2 inline dark:hidden"
            alt="trainwreck"
          />
          <img
            src={trainwreckWhite}
            width={14}
            height={14}
            class="mx-2 hidden dark:inline"
            alt="trainwreck"
          />
        </a>
        <a
          href="https://discord.gg/Xpyy8dCr9g"
          aria-label="Discord"
          class="flex items-center gap-2 transition-opacity hover:opacity-80"
          target="_blank"
        >
          <span data-i18n="Footer3">Find TWL on Discord</span>
          <Icon shape="discord" size={18} class="mt-1" />
        </a>
      </div>
      <div class="text-right">
        <p data-i18n="Aux2">Have a question?</p>
        <a
          href="/faq"
          class="underline transition-opacity hover:opacity-80"
          data-cy="faq-footer-link"
          data-i18n="Aux3"
        >
          Check out the FAQ.
        </a>
        <p data-ccpa-link="1" class="underline" />
        <div id="ncmp-consent-link" class="underline" />
        <VersionDisplay className="mt-2" />
      </div>
    </footer>
  );
}
