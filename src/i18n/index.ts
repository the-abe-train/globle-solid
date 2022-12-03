import i18next, { Resource } from "i18next";
import UAParser from "ua-parser-js";
import { getContext } from "../Context";
import { getMaxColour } from "../util/colour";
import { English } from "./en-CA";
import Spanish from "./es-MX";
import French from "./fr-FR";
import Portuguese from "./pt-BR";

export const langMap = [
  { locale: "en-CA", langKey: "NAME", resource: English, name: "English" },
  { locale: "fr-FR", langKey: "NAME_FR", resource: French, name: "Français" },
  { locale: "es-MX", langKey: "NAME_ES", resource: Spanish, name: "Español" },
  {
    locale: "pt-BR",
    langKey: "NAME_PT",
    resource: Portuguese,
    name: "Português",
  },
] as const;
console.log(langMap);
export type Locale = typeof langMap[number]["locale"];

export function getLangKey() {
  const context = getContext();
  const { locale } = context.locale();
  const lang = langMap.find((lang) => lang.locale === locale);
  return lang?.langKey ?? "NAME";
}

const resources = langMap.reduce((obj, lang) => {
  obj[lang.locale] = { translation: lang.resource };
  return obj;
}, {} as Resource);
console.log(resources);

export function translate(
  key: string,
  defaultValue: string,
  interpolation?: Record<string, string>
) {
  const parser = new UAParser();
  const isMobile = parser.getDevice().type === "mobile";
  const Click = isMobile ? i18next.t("Tap") : i18next.t("Click");
  const options = {
    Click,
    click: Click && Click.toLowerCase(),
    defaultValue,
    ...interpolation,
  };
  return i18next.t(key, options);
}

export async function translatePage() {
  const context = getContext();
  const { isDark } = context.theme();
  const { colours } = context.colours();
  const { locale } = context.locale();

  // i18next.getResource("fr")

  if (!i18next.isInitialized) {
    await i18next.init({
      fallbackLng: "en",
      // debug: true,
      lng: locale,
      resources,
    });
  } else {
    await i18next.changeLanguage(locale);
    // console.table(i18next.languages);
  }
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const attr = el.getAttribute("data-i18n") ?? "";
    const defaultValue = el.innerHTML;
    el.innerHTML = translate(attr, defaultValue);
  });
  document.querySelectorAll<HTMLElement>("[data-stylize]").forEach((el) => {
    el.style.color = getMaxColour(colours, isDark);
  });
}
