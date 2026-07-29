import { createMemo, For, lazy, Suspense } from 'solid-js';
import { t } from '../i18n';
import Preview from '../components/Preview';
import NitroPayAd from '../components/NitroPayAd';
import { getContext } from '../Context';
import { getMaxColour } from '../util/colour';
const NavGlobe = lazy(() => import('../components/globes/NavGlobe'));

type RichTranslationProps = {
  i18n: keyof i18nMessages;
  defaultValue: string;
  emphasisColour?: string;
};

function RichTranslation(props: RichTranslationProps) {
  const parts = createMemo(() => {
    const message = t(props.i18n, props.defaultValue);
    const tokens: Array<{ text: string; emphasized: boolean }> = [];
    const emphasisPattern = /<b(?:\s[^>]*)?>(.*?)<\/b>/gis;
    let cursor = 0;

    for (const match of message.matchAll(emphasisPattern)) {
      const index = match.index ?? 0;
      if (index > cursor) {
        tokens.push({ text: message.slice(cursor, index), emphasized: false });
      }
      tokens.push({ text: match[1], emphasized: true });
      cursor = index + match[0].length;
    }

    if (cursor < message.length) {
      tokens.push({ text: message.slice(cursor), emphasized: false });
    }
    return tokens;
  });

  return (
    <For each={parts()}>
      {(part) =>
        part.emphasized ? (
          <b style={props.emphasisColour ? { color: props.emphasisColour } : undefined}>
            {part.text}
          </b>
        ) : (
          part.text
        )
      }
    </For>
  );
}

export default function () {
  const context = getContext();
  const emphasisColour = () => getMaxColour(context.colours().colours, context.theme().isDark);

  return (
    <div class="space-y-5">
      <h2 class="font-header my-5 text-center text-2xl font-extrabold" data-i18n="helpTitle">
        {t('helpTitle', 'How to Play')}
      </h2>
      <p data-i18n="help1">
        <RichTranslation
          i18n="help1"
          defaultValue="Every day, there is a new Mystery Country. Your goal is to guess which country it is using as few guesses as possible. Each incorrect guess will appear on the globe with a colour indicating how close it is to the Mystery Country. The <b>hotter</b> the colour, the closer you are to the answer."
          emphasisColour={emphasisColour()}
        />
      </p>
      <p data-i18n="help2">
        <RichTranslation
          i18n="help2"
          defaultValue="For example, if the Mystery Country is <b>Japan</b>, then the following countries would appear with these colours if guessed:"
        />
      </p>
      <div class="mr-10 sm:mr-16">
        <Preview />
      </div>
      <p data-i18n="help3">{t('help3', 'A new Mystery Country will be available every day!')}</p>
      <Suspense fallback={<p data-i18n="Loading">{t('Loading', 'Loading...')}</p>}>
        <NavGlobe />
      </Suspense>
      <p class="pt-4 text-sm">
        Already found today's Mystery Country? Find the world's capital cities with{' '}
        <a
          class="underline"
          target="_blank"
          href="https://globle-capitals.com?utm_source=globle&utm_medium=referral"
        >
          Globle: Capitals
        </a>{' '}
        or play against your friends with{' '}
        <a
          class="underline"
          target="_blank"
          href="https://globle-leagues.com?utm_source=globle&utm_medium=referral"
        >
          Globle: Leagues
        </a>
        !
      </p>
      <NitroPayAd />
    </div>
  );
}
