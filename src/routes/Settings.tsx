import { createEffect, createSignal, Suspense } from "solid-js";
import Backup from "../components/Backup";
import Toggle from "../components/Toggle";
import { getContext } from "../Context";
import { useNavigate } from "@solidjs/router";
import SelectMenu from "../components/SelectMenu";
import { langMap1, translate, translatePage } from "../i18n";
import NavGlobe from "../components/globes/NavGlobe";
import { createPracticeAns } from "../util/practice";
import { getColourScheme } from "../util/colour";

export default function () {
  const context = getContext();
  const navigate = useNavigate();

  const isAlreadyDark = context.theme().isDark;
  const [isDark, setDark] = createSignal(isAlreadyDark);
  createEffect(() => context?.setTheme({ isDark: isDark() }));

  const labelsAlreadyOn = context.labelsOn().labelsOn;
  const [labelsOn, setLabelsOn] = createSignal(labelsAlreadyOn);
  createEffect(() => context?.setLabelsOn({ labelsOn: labelsOn() }));

  const currentLocale = context.locale().locale;
  const [locale, setLocale] = createSignal(currentLocale);
  createEffect(() => {
    context?.setLocale({ locale: locale() });
    translatePage();
  });

  const currentColours = context.colours().colours;
  const [colours, setColours] = createSignal(currentColours);
  createEffect(() => {
    context?.setColours({ colours: colours() });
  });

  function enterPracticeMode() {
    createPracticeAns();
    navigate("/practice");
  }

  return (
    <div class="space-y-10">
      <div class="space-y-5">
        <h2
          class="text-center text-2xl my-5 font-extrabold font-header"
          data-i18n="SettingsTitle"
        >
          Settings
        </h2>
        <div class="max-w-xs mx-auto space-y-3">
          <Toggle
            setToggle={setDark}
            toggleProp={isDark}
            on={translate("Settings2", "Night")}
            off={translate("Settings1", "Day")}
          />
          <Toggle
            setToggle={setLabelsOn}
            toggleProp={labelsOn}
            on={translate("Settings13", "Labels on")}
            off={translate("Settings14", "Labels off")}
          />
          <SelectMenu
            name={translate("Settings7", "Language")}
            choice={locale}
            choose={setLocale}
            list={Object.keys(langMap1)}
          />
          <SelectMenu
            name={translate("Settings12", "Colours")}
            choice={colours}
            choose={setColours}
            list={Object.keys(getColourScheme(isDark()))}
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
          <span class="font-medium text-base" data-i18n="Settings9">
            Play practice game
          </span>
        </button>
      </div>
      <Backup />
      <Suspense fallback={<p data-i18n="Loading">Loading...</p>}>
        <NavGlobe />
      </Suspense>
    </div>
  );
}
