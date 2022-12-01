import i18next from "i18next";
import { getContext } from "../Context";
import { English } from "./en-CA";
import { French } from "./fr-FR";

const langMap = {
  "en-CA": "English",
  "fr-FR": "Français",
};

export const languages = Object.keys(langMap).map((locale) => {
  return { name: langMap[locale as Locale], value: locale };
});

export const resources = {
  fr: { translation: French },
  en: { translation: English },
};

export type Locale = keyof typeof langMap;

export const langNameMap: Record<Locale, LanguageName> = {
  // "pt-BR": "NAME_PT",
  // "es-MX": "NAME_ES",
  "en-CA": "NAME_EN",
  "fr-FR": "NAME_FR",
  // "de-DE": "NAME_DE",
  // "hu-HU": "NAME_HU",
  // "pl-PL": "NAME_PL",
  // "it-IT": "NAME_IT",
  // "sv-SE": "NAME_SV",
};

export async function translatePage() {
  const context = getContext();
  const { locale } = context.locale();
  // if (locale === "en-CA") return;
  const maxColour = "#D30000";
  if (!i18next.isInitialized) {
    await i18next.init({
      fallbackLng: "en",
      debug: true,
      lng: locale,
      resources,
    });
  } else {
    await i18next.changeLanguage(locale);
  }
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const attr = el.getAttribute("data-i18n") ?? "";
    const defaultValue = el.innerHTML;
    el.innerHTML = i18next.t(attr, defaultValue);
  });
  document.querySelectorAll("b").forEach((el) => {
    el.classList.add(`text-[${maxColour}]`);
  });
}
