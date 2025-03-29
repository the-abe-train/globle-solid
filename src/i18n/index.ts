import i18next, { Resource, TOptions } from "i18next";
import UAParser from "ua-parser-js";
import { getContext } from "../Context";
import { getMaxColour } from "../util/colour";
import { English } from "./en-CA";
import { Spanish } from "./es-MX";
import { French } from "./fr-FR";
import { Portuguese } from "./pt-BR";
import { German } from "./de-DE";
import { Italian } from "./it-IT";
import { Polish } from "./pl-PL";
import { Swedish } from "./sv-SE";
import { Hungarian } from "./hu-HU";
import { Norwegian } from "./no-NO";
import { Russian } from "./ru-RU";
import { Lithuanian } from "./lt-LT";
import { Xhosa } from "./xh-ZA";

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
  { locale: "de-DE", langKey: "NAME_DE", resource: German, name: "Deutsch" },
  { locale: "hu-HU", langKey: "NAME_HU", resource: Hungarian, name: "Magyar" },
  { locale: "it-IT", langKey: "NAME_IT", resource: Italian, name: "Italiano" },
  { locale: "sv-SE", langKey: "NAME_SV", resource: Swedish, name: "Svenska" },
  { locale: "pl-PL", langKey: "NAME_PL", resource: Polish, name: "Polski" },
  { locale: "no-NO", langKey: "NAME_NO", resource: Norwegian, name: "Norsk" },
  { locale: "ru-RU", langKey: "NAME_RU", resource: Russian, name: "Русский" },
  {
    locale: "lt-LT",
    langKey: "NAME_LT",
    resource: Lithuanian,
    name: "Lietuvių",
  },
  { locale: "xh-ZA", langKey: "NAME_XH", resource: Xhosa, name: "isiXhosa" },
] as const;
export type Locale = (typeof langMap)[number]["locale"] & string;

export function getLangKey(locale: Locale) {
  const lang = langMap.find((lang) => lang.locale === locale);
  return lang?.langKey ?? "NAME";
}

const resources = langMap.reduce((obj, lang) => {
  obj[lang.locale] = { translation: lang.resource };
  return obj;
}, {} as Resource);

type KeyWords = "guess" | "answer" | "Click" | "click" | "Côte d'Ivoire";

export function translate(
  key: keyof Messages,
  defaultValue: string,
  interpolation?: Partial<Record<KeyWords, string>>
): string {
  const parser = new UAParser();
  const isMobile = parser.getDevice().type === "mobile";
  const Click = isMobile ? i18next.t("Tap") : i18next.t("Click");
  const options = {
    defaultValue,
    Click,
    click: Click && Click.toLowerCase(),
    "Côte d'Ivoire": "Côte test",
    interpolation: { escapeValue: false },
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
    const attr = el.getAttribute("data-i18n") as keyof Messages;
    // Check if attr is a key of Messages
    if (!attr || !(attr in English)) return;

    const defaultValue = el.innerHTML;
    el.innerHTML = translate(attr, defaultValue);
  });
  document.querySelectorAll<HTMLElement>("[data-stylize]").forEach((el) => {
    el.style.color = getMaxColour(colours, isDark);
  });
}
