import { A } from "@solidjs/router";
import Icon from "./Icon";
import trainwreckWhite from "../images/trainwreck-white.svg";
import trainwreckBlack from "../images/trainwreck-black.svg";

export default function Footer() {
  return (
    <footer
      class="pt-8 pb-4 text-xs flex items-end justify-between w-full 
    flex-grow mb-24"
    >
      <span class="space-x-1 flex">
        <a href="https://trainwrecklabs.com">
          <span data-i18n="Footer1">by Trainwreck Labs</span>
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
          href="https://twitter.com/theAbeTrain"
          aria-label="Twitter"
          class="inline"
        >
          <Icon shape="twitter" size={14} />
        </a>
      </span>
      <p>
        <span data-i18n="Aux2">Have a question?</span> <br class="sm:hidden" />
        <A
          href="/faq"
          class="underline"
          data-cy="faq-footer-link"
          data-i18n="Aux3"
        >
          Check out the FAQ.
        </A>
      </p>
    </footer>
  );
}
