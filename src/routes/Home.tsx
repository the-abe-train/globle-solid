import { lazy, onMount, Suspense } from 'solid-js';
import { translatePage } from '../i18n';
import Preview from '../components/Preview';
import NitroPayAd from '../components/NitroPayAd';
const NavGlobe = lazy(() => import('../components/globes/NavGlobe'));

export default function () {
  onMount(translatePage);

  return (
    <div class="space-y-5">
      <h2 class="font-header my-5 text-center text-2xl font-extrabold" data-i18n="helpTitle">
        How to Play
      </h2>
      <p data-i18n="help1">
        Every day, there is a new Mystery Country. Your goal is to guess which country it is using
        as few guesses as possible. Each incorrect guess will appear on the globe with a colour
        indicating how close it is to the Mystery Country. The{' '}
        <b data-stylize="max-colour">hotter</b> the colour, the closer you are to the answer.
      </p>
      <p data-i18n="help2">
        For example, if the Mystery Country is <b>Japan</b>, then the following countries would
        appear with these colours if guessed:
      </p>
      <div class="mr-10 sm:mr-16">
        <Preview />
      </div>
      <p data-i18n="help3">A new Mystery Country will be available every day!</p>
      <Suspense fallback={<p data-i18n="Loading">Loading...</p>}>
        <NavGlobe />
      </Suspense>
      <p data-i18n="help4" class="pt-4 text-sm">
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
