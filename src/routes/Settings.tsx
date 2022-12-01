import { createEffect, createSignal, lazy, onMount, Suspense } from "solid-js";
import Backup from "../components/Backup";
import Toggle from "../components/Toggle";
import { getContext } from "../Context";
// import { createPracticeAns } from "../util/practice";
import { useNavigate } from "@solidjs/router";
import SelectMenu from "../components/SelectMenu";
import { languages, translatePage } from "../i18n";
import NavGlobe from "../components/globes/NavGlobe";
// const NavGlobe = lazy(() => import("../components/globes/NavGlobe"));

export default function () {
  const context = getContext();
  const navigate = useNavigate();

  const isAlreadyDark = context.theme().isDark;
  const [isDark, setDark] = createSignal(isAlreadyDark);
  createEffect(() => context?.setTheme({ isDark: isDark() }));

  const currentLocale = context.locale().locale;
  const [locale, setLocale] = createSignal(currentLocale);
  createEffect(() => {
    context?.setLocale({ locale: locale() });
    translatePage();
  });

  function enterPracticeMode() {
    return null;
    // createPracticeAns();
    // navigate("/practice");
  }

  return (
    <div class="py-4 space-y-8">
      <h2
        class="text-3xl text-center font-header font-extrabold"
        data-i18n="SettingsTitle"
      >
        Settings
      </h2>
      <div class="max-w-xs mx-auto space-y-3">
        <Toggle setToggle={setDark} toggleProp={isDark} on="Night" off="Day" />
        <SelectMenu
          name="Language"
          choice={locale}
          choose={setLocale}
          list={languages}
        />
      </div>
      <button
        onClick={enterPracticeMode}
        data-cy="practice-link"
        class="bg-blue-700 dark:bg-purple-800 hover:bg-blue-900
         dark:hover:bg-purple-900 disabled:bg-blue-900  text-white 
        focus:ring-4 focus:ring-blue-300 rounded-lg text-sm
        px-4 py-2.5 text-center items-center
        justify-center self-center mx-auto block"
      >
        <span class="font-medium text-base">Play practice game</span>
      </button>
      <Backup />
      <Suspense fallback={<p>Loading...</p>}>
        <NavGlobe />
      </Suspense>
    </div>
  );
}
