import i18next from "i18next";
import { createSignal, For, onMount, Show } from "solid-js";
import { translatePage } from "../i18n";

type Link = { text: string; link: string };
type ItemProps = { q: string; a: string; links?: Link[]; idx: number };

function Item({ q, a, links, idx }: ItemProps) {
  const [open, setOpen] = createSignal(false);
  const num = idx + 1;

  let answer = i18next.t("a" + num, a);
  if (links)
    links.forEach(({ link, text }) => {
      answer = answer.replace(
        text,
        `<a class="underline" href="${link}">${text}</a>`
      );
    });

  const question = (
    <dt
      class="font-bold cursor-pointer pb-3"
      onClick={() => setOpen((prev) => !prev)}
      data-i18n={"q" + num}
    >
      {num}. {q}
    </dt>
  );
  return (
    <div class="space-y-1">
      <Show when={open()} fallback={question}>
        {question}
        <p innerHTML={answer} data-i18n={"a" + num} />
      </Show>
    </div>
  );
}

export default function () {
  onMount(translatePage);
  const faqs = [
    {
      q: "How is the distance between the answer and my guess calculated?",
      a: "Distance between countries is defined as the minimum distance between their land borders along the Earth's surface. Territories (areas that appear in gray when their parent country is guessed) and water borders are not included in distance calculations.",
    },
    {
      q: "How can I play the game if I am colour blind or visually impaired?",
      a: `A high-contrast Colour Blind mode can be activated in Settings.`,
      links: [
        {
          text: "Settings",
          link: "/settings",
        },
      ],
    },
    {
      q: "How does the game decide what is a valid country?",
      a: "Globle uses this <a>framework</a> to determine what constitutes a valid guess.",
      links: [
        {
          text: "framework",
          link: "https://www.sporcle.com/blog/2013/01/what-is-a-country/",
        },
      ],
    },
    {
      q: "Are autonomous but not sovereign countries in the game?",
      a: "Some territories will appear in a neutral colour when their sovereign country is guessed, e.g. Greenland for Denmark. The location of these territories does not impact the colour of the sovereign country. Most small territories do not appear in the game, e.g. Curaçao.",
    },
    {
      q: "I found today's mystery country! When do I get to play again?",
      a: "The mystery country changes and your guesses reset at midnight in your time zone.",
    },
    {
      q: "Are alternative spellings for countries acceptable?",
      a: "There are many countries with multiple acceptable names. Some alternate spellings and previous names are accepted, e.g. Burma for Myanmar. As well, acronyms are acceptable for some multi-word countries, e.g. UAE for United Arab Emirates.",
    },
    {
      q: "A country is missing or a border is incorrect. What can I do about it?",
      a: "Geography can be a sensitive topic, and some countries' borders are disputed. If you believe a correction should be made, please politely raise an issue on GitHub or DM me on Twitter.",
      links: [
        {
          text: "GitHub",
          link: "https://github.com/the-abe-train/globle-solid",
        },
        { text: "Twitter", link: "https://twitter.com/theAbeTrain" },
      ],
    },
    {
      q: "Why are my friend and I getting different mystery countries?",
      a: "Sometimes updates to the game don't reach everyone's browsers/devices at the same time. To fix this issue, you can get the latest code by doing a hard refresh (Ctrl + Shift + R on desktop, instructions vary for mobile devices).",
    },
    {
      q: "Does Globle have a privacy policy?",
      a: "The Privacy Policy can be found here.",
      links: [{ text: "here", link: "/privacy-policy" }],
    },
  ];
  return (
    <div class="space-y-6 my-4">
      <h2 class="text-3xl text-center font-header font-extrabold dark:text-gray-200">
        FAQ
      </h2>
      <For each={faqs}>
        {(faq, idx) => {
          return <Item {...faq} idx={idx()} />;
        }}
      </For>
    </div>
  );
}
