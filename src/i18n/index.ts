import i18next, { Resource } from "i18next";
import UAParser from "ua-parser-js";
import { getContext } from "../Context";
import { getMaxColour } from "../util/colour";
import { English } from "./en-CA";
import { Spanish } from "./es-MX";
import { French } from "./fr-FR";

export const langMap1 = {
  English: "en-CA",
  Français: "fr-FR",
  Español: "es-MX",
};

export const resources: Resource = {
  fr: { translation: French },
  en: { translation: English },
  es: { translation: Spanish },
};

export type Language = keyof typeof langMap1;

export const langMap2 = {
  // "pt-BR": "NAME_PT",
  Español: "NAME_ES",
  English: "NAME_EN",
  Français: "NAME_FR",
  // "de-DE": "NAME_DE",
  // "hu-HU": "NAME_HU",
  // "pl-PL": "NAME_PL",
  // "it-IT": "NAME_IT",
  // "sv-SE": "NAME_SV",
} as Record<Language, keyof Country["properties"]>;
// } as Record<Language, string>;

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
  if (!i18next.isInitialized) {
    await i18next.init({
      fallbackLng: "en",
      // debug: true,
      lng: langMap1[locale],
      resources,
    });
  } else {
    await i18next.changeLanguage(langMap1[locale]);
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
