import { A } from "@solidjs/router";
import Icon from "./Icon";

export default function Footer() {
  return (
    <footer class="pt-8 pb-4 text-xs flex items-end justify-between w-full flex-grow">
      <span class="space-x-1 flex">
        <a href="https://the-abe-train.com" data-i18n="Footer1">
          by The Abe Train
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
