import Icon from "./Icon";
import trainwreckWhite from "../images/trainwreck-white.svg";
import trainwreckBlack from "../images/trainwreck-black.svg";
import { onMount } from "solid-js";

declare global {
  interface Window {
    __uspapi?: (command: string, version: number) => void;
    __cmp?: (command: string) => void;
  }
}

export default function Footer() {
  onMount(() => {
    if (window.__uspapi) {
      window.__uspapi("addLink", 1);
    }
    if (window["__cmp"]) {
      window["__cmp"]("addConsentLink");
    }
  });
  return (
    <footer
      class="pt-8 pb-4 text-xs flex items-end justify-between w-full 
    flex-grow mb-24"
    >
      <div class="space-y-3">
        <a href="https://trainwrecklabs.com" data-i18n="Footer1">
          <span>by Trainwreck Labs</span>
          <img
            src={trainwreckBlack}
            width={14}
            height={14}
            class="mx-2 mb-[1px] inline dark:hidden"
            alt="trainwreck"
          />
          <img
            src={trainwreckWhite}
            width={14}
            height={14}
            class="mx-2 mb-[1px] hidden dark:inline "
            alt="trainwreck"
          />
        </a>
        <a
          href="https://discord.gg/Xpyy8dCr9g"
          aria-label="Discord"
          class="flex items-center space-x-2"
          target="_blank"
        >
          <span class="mb-1" data-i18n="Footer3">
            Find TWL on Discord
          </span>
          <Icon shape="discord" size={18} />
        </a>
      </div>
      <div class="space-y-3">
        <p data-i18n="Aux2">Have a question?</p>
        {/* <br class="sm:hidden" /> */}
        <a
          href="/faq"
          class="underline block"
          data-cy="faq-footer-link"
          data-i18n="Aux3"
        >
          Check out the FAQ.
        </a>
        <p data-ccpa-link="1" class="underline" />
        <div id="ncmp-consent-link" class="underline" />
      </div>
    </footer>
  );
}
