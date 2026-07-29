import i18next, { Resource } from 'i18next';
import { createSignal } from 'solid-js';
import { isMobile } from '../util/globe';
import { Arabic } from './ar-SA';
import { English } from './en-CA';
import { Spanish } from './es-MX';
import { French } from './fr-FR';
import { Portuguese } from './pt-BR';
import { German } from './de-DE';
import { Italian } from './it-IT';
import { Polish } from './pl-PL';
import { Swedish } from './sv-SE';
import { Hungarian } from './hu-HU';
import { Norwegian } from './no-NO';
import { Russian } from './ru-RU';
import { Lithuanian } from './lt-LT';
import { Xhosa } from './xh-ZA';

export const langMap = [
  { locale: 'en-CA', langKey: 'NAME', resource: English, name: 'English' },
  { locale: 'ar-SA', langKey: 'NAME_AR', resource: Arabic, name: 'العربية' },
  { locale: 'fr-FR', langKey: 'NAME_FR', resource: French, name: 'Français' },
  { locale: 'es-MX', langKey: 'NAME_ES', resource: Spanish, name: 'Español' },
  {
    locale: 'pt-BR',
    langKey: 'NAME_PT',
    resource: Portuguese,
    name: 'Português',
  },
  { locale: 'de-DE', langKey: 'NAME_DE', resource: German, name: 'Deutsch' },
  { locale: 'hu-HU', langKey: 'NAME_HU', resource: Hungarian, name: 'Magyar' },
  { locale: 'it-IT', langKey: 'NAME_IT', resource: Italian, name: 'Italiano' },
  { locale: 'sv-SE', langKey: 'NAME_SV', resource: Swedish, name: 'Svenska' },
  { locale: 'pl-PL', langKey: 'NAME_PL', resource: Polish, name: 'Polski' },
  { locale: 'no-NO', langKey: 'NAME_NO', resource: Norwegian, name: 'Norsk' },
  { locale: 'ru-RU', langKey: 'NAME_RU', resource: Russian, name: 'Русский' },
  {
    locale: 'lt-LT',
    langKey: 'NAME_LT',
    resource: Lithuanian,
    name: 'Lietuvių',
  },
  { locale: 'xh-ZA', langKey: 'NAME_XH', resource: Xhosa, name: 'isiXhosa' },
] as const;
export type Locale = (typeof langMap)[number]['locale'] & string;
export const DEFAULT_LOCALE: Locale = 'en-CA';

export function getLangKey(locale: Locale) {
  const lang = langMap.find((lang) => lang.locale === locale);
  return lang?.langKey ?? 'NAME';
}

const resources = langMap.reduce((obj, lang) => {
  obj[lang.locale] = { translation: lang.resource };
  return obj;
}, {} as Resource);

type KeyWords = 'guess' | 'answer' | 'Click' | 'click';

const [translationVersion, setTranslationVersion] = createSignal(0);
let initializationPromise: Promise<unknown> | undefined;

export function isLocale(value: unknown): value is Locale {
  return langMap.some(({ locale }) => locale === value);
}

export function getInitialLocale(): Locale {
  try {
    const storedLocale = JSON.parse(localStorage.getItem('locale') ?? 'null') as {
      locale?: unknown;
    } | null;
    if (isLocale(storedLocale?.locale)) return storedLocale.locale;
  } catch {
    // Replace malformed locale state with the default below.
  }

  localStorage.setItem('locale', JSON.stringify({ locale: DEFAULT_LOCALE }));
  return DEFAULT_LOCALE;
}

export async function initializeI18n(locale: Locale) {
  let languageChanged = false;

  if (!i18next.isInitialized) {
    initializationPromise ??= i18next.init({
      fallbackLng: DEFAULT_LOCALE,
      lng: locale,
      resources,
    });
    await initializationPromise;
    languageChanged = true;
  }

  if (i18next.language !== locale) {
    await i18next.changeLanguage(locale);
    languageChanged = true;
  }

  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar-SA' ? 'rtl' : 'ltr';
  if (languageChanged) {
    setTranslationVersion((version) => version + 1);
  }
}

export function t(
  key: keyof i18nMessages,
  defaultValue: string = key,
  interpolation?: Partial<Record<KeyWords, string>>,
): string {
  translationVersion();
  const Click = isMobile() ? i18next.t('Tap') : i18next.t('Click');
  const options = {
    defaultValue,
    Click,
    click: Click && Click.toLowerCase(),
    interpolation: { escapeValue: false },
    ...interpolation,
  };
  return i18next.t(key, options);
}
