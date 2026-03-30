import i18next from 'i18next';
import { createEffect, createMemo, createSignal, For } from 'solid-js';
import { getContext } from '../Context';
import { translatePage } from '../i18n';

type Link = { text: string; link: string };
type ItemProps = { q: string; a: string; links?: Link[]; idx: number };

function stripQuestionNumberPrefix(question: string) {
  return question.replace(/^\s*\d+\.\s*/, '');
}

function isExternalLink(link: string) {
  return /^https?:\/\//i.test(link);
}

function getAnchorAttributes(link: string) {
  return isExternalLink(link) ? ' target="_blank" rel="noopener noreferrer"' : '';
}

function addExternalLinkAttrs(answer: string) {
  return answer.replace(
    /<a([^>]*?)href="(https?:\/\/[^\"]+)"([^>]*)>/gi,
    (match, beforeHref: string, href: string, afterHref: string) => {
      if (/\starget=/.test(match)) return match;
      return `<a${beforeHref}href="${href}"${afterHref}${getAnchorAttributes(href)}>`;
    },
  );
}

function formatAnswer(answer: string, links?: Link[]) {
  if (!links?.length) return addExternalLinkAttrs(answer);

  let linkIndex = 0;
  const answerWithPlaceholders = answer.replace(
    /<(a|button)>(.*?)<\/\1>/g,
    (_match, _tag, content: string) => {
      const currentLink = links[linkIndex++];
      if (!currentLink) return content;

      return `<a class="underline" href="${currentLink.link}"${getAnchorAttributes(currentLink.link)}>${content || currentLink.text}</a>`;
    },
  );

  if (linkIndex > 0) return addExternalLinkAttrs(answerWithPlaceholders);

  let formattedAnswer = answerWithPlaceholders;
  links.forEach(({ link, text }) => {
    formattedAnswer = formattedAnswer.replace(
      text,
      `<a class="underline" href="${link}"${getAnchorAttributes(link)}>${text}</a>`,
    );
  });

  return addExternalLinkAttrs(formattedAnswer);
}

function Item({ q, a, links, idx }: ItemProps) {
  const { locale } = getContext();
  const [open, setOpen] = createSignal(false);
  const num = idx + 1;

  const question = createMemo(() => {
    locale();
    return stripQuestionNumberPrefix(i18next.t('q' + num, { defaultValue: q }));
  });

  const answer = createMemo(() => {
    locale();
    return formatAnswer(i18next.t('a' + num, { defaultValue: a }), links);
  });

  const questionNode = (
    <dt class="cursor-pointer pb-3 font-bold" onClick={() => setOpen((prev) => !prev)}>
      {num}. {question()}
    </dt>
  );
  return (
    <div class="space-y-1">
      {questionNode}
      <p innerHTML={answer()} class={open() ? '' : 'hidden'} />
    </div>
  );
}

export default function () {
  const { locale } = getContext();
  const [translationVersion, setTranslationVersion] = createSignal(0);

  createEffect(() => {
    locale();
    void translatePage().then(() => {
      setTranslationVersion((version) => version + 1);
    });
  });

  const title = createMemo(() => {
    translationVersion();
    return i18next.t('FAQTitle', { defaultValue: 'FAQ' });
  });

  const faqs = [
    {
      q: 'How is the distance between the answer and my guess calculated?',
      a: "Distance between countries is defined as the minimum distance between their land borders along the Earth's surface. Territories (areas that appear in gray when their parent country is guessed) and water borders are not included in distance calculations.",
    },
    {
      q: 'How can I play the game if I am colour blind or visually impaired?',
      a: `A high-contrast Colour Blind mode can be activated in Settings.`,
      links: [
        {
          text: 'Settings',
          link: '/settings',
        },
      ],
    },
    {
      q: 'How does the game decide what is a valid country?',
      a: 'Globle uses this <a>framework</a> to determine what constitutes a valid guess.',
      links: [
        {
          text: 'framework',
          link: 'https://www.sporcle.com/blog/2013/01/what-is-a-country/',
        },
      ],
    },
    {
      q: 'Are autonomous but not sovereign countries in the game?',
      a: 'Some territories will appear in a neutral colour when their sovereign country is guessed, e.g. Greenland for Denmark. The location of these territories does not impact the colour of the sovereign country. Most small territories do not appear in the game, e.g. Curaçao.',
    },
    {
      q: "I found today's mystery country! When do I get to play again?",
      a: 'The mystery country changes and your guesses reset at midnight in your time zone.',
    },
    {
      q: 'Are alternative spellings for countries acceptable?',
      a: 'There are many countries with multiple acceptable names. Some alternate spellings and previous names are accepted, e.g. Burma for Myanmar. As well, acronyms are acceptable for some multi-word countries, e.g. UAE for United Arab Emirates.',
    },
    {
      q: 'A country is missing or a border is incorrect. What can I do about it?',
      a: "Geography can be a sensitive topic, and some countries' borders are disputed. If you believe a correction should be made, please DM me on Twitter.",
      links: [{ text: 'Twitter', link: 'https://twitter.com/theAbeTrain' }],
    },
    {
      q: 'Why are my friend and I getting different mystery countries?',
      a: "Sometimes updates to the game don't reach everyone's browsers/devices at the same time. To fix this issue, you can get the latest code by doing a hard refresh (Ctrl + Shift + R on desktop, instructions vary for mobile devices).",
    },
    {
      q: 'Does Globle have a privacy policy?',
      a: "Check out Globle's privacy policy here.",
      links: [{ text: 'privacy policy here', link: '/privacy-policy' }],
    },
  ];
  return (
    <div class="my-4 space-y-6">
      <h2 class="font-header text-center text-3xl font-extrabold dark:text-gray-200">{title()}</h2>
      <For each={faqs}>
        {(faq, idx) => {
          return <Item {...faq} idx={idx()} />;
        }}
      </For>
    </div>
  );
}
