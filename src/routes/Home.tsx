import { onMount, Suspense } from "solid-js";
import { translatePage } from "../i18n";
// import Preview from "../components/Preview";
// import { maxColour } from "../util/geometry";

// import NavGlobe from "../components/globes/NavGlobe";
// const NavGlobe = lazy(() => import("../components/globes/NavGlobe"));

export default function () {
  const maxColour = "#D30000";
  onMount(translatePage);

  return (
    <div class="my-2 space-y-5">
      <h2
        class="text-center text-2xl my-5 font-extrabold font-header "
        data-i18n="helpTitle"
      >
        How to Play
      </h2>
      <p data-i18n="help1">
        Every day, there is a Mystery Capital City. Your goal is to guess which
        capital it is using the fewest number of guesses. Each incorrect guess
        will appear on the globe with a colour indicating how close it is to the
        Mystery Capital. Every additional guess will create a colourful arc to
        help you further. The <b style={{ color: maxColour }}>hotter</b> the
        colour, the closer you are to the answer.
      </p>
      <p data-i18n="help2">
        For example, if the Mystery Capital is Cairo, then your path of guesses
        might look like the following:
      </p>
      <div class="mr-10 sm:mr-16">{/* <Preview /> */}</div>
      <p data-i18n="help3">
        A new Mystery Capital will be available every day!
      </p>
      <Suspense fallback={<p data-i18n="Loading">Loading...</p>}>
        {/* <NavGlobe /> */}
      </Suspense>
      <p>
        Or{" "}
        <a class="underline" href="https://globle-game.com">
          click here
        </a>{" "}
        to play the <i>Globle</i> with countries!
      </p>
    </div>
  );
}
