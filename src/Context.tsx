import dayjs from "dayjs";
import {
  Accessor,
  createContext,
  createEffect,
  createSignal,
  Setter,
  useContext,
} from "solid-js";
import { Locale } from "./i18n";

function getStorageValue<T extends object>(key: string, defaultValue?: T) {
  const saved = localStorage.getItem(key);
  if (saved) {
    return JSON.parse(saved) as T;
  } else if (defaultValue) {
    return defaultValue;
  } else {
    throw new Error("Local storage error");
  }
}

export function useLocalStorage<T extends Record<string, any>>(
  key: string,
  defaultValue: T
): [Accessor<T>, Setter<T>] {
  const storedValue = getStorageValue<T>(key, defaultValue);
  const [newValue, setNewValue] = createSignal(storedValue);
  createEffect(() => {
    localStorage.setItem(key, JSON.stringify(newValue()));
  });
  return [newValue, setNewValue];
}

export const makeContext = (mode: "Stored" | "Static") => {
  const initial = {
    theme: { isDark: false },
    labels: { labelsOn: false },
    statistics: {
      gamesWon: 0,
      lastWin: "1970-01-01",
      currentStreak: 0,
      maxStreak: 0,
      usedGuesses: [] as number[],
      emojiGuesses: "",
    },
    guesses: {
      countries: [] as string[],
      expiration: dayjs().endOf("day").toDate(),
    },
    distanceUnit: { unit: "km" as Unit },
    token: { google: "" },
    locale: { locale: "en-CA" as Locale },
  };

  type Keys = keyof typeof initial;

  // There needs to be the "Static" option for initial page render, otherwise
  // there's warnings in the console because it doesn't like the createEffect
  // in useLocalStorage running outside of render.
  function create<T extends Keys>(key: T) {
    const defaultValue = initial[key];
    if (mode === "Stored") {
      return useLocalStorage(key, defaultValue);
    } else {
      return createSignal(defaultValue);
    }
  }

  const [theme, setTheme] = create("theme");
  const [labelsOn, setLabelsOn] = create("labels");
  const [storedStats, storeStats] = create("statistics");
  const [storedGuesses, storeGuesses] = create("guesses");
  const [token, setToken] = create("token");
  const [distanceUnit, setDistanceUnit] = create("distanceUnit");
  const [locale, setLocale] = create("locale");

  return {
    theme,
    setTheme,
    labelsOn,
    setLabelsOn,
    storedStats,
    storeStats,
    storedGuesses,
    storeGuesses,
    resetStats: () => storeStats(initial.statistics),
    resetGuesses: () => storeGuesses(initial.guesses),
    distanceUnit,
    setDistanceUnit,
    token,
    setToken,
    locale,
    setLocale,
  };
};

export const GlobalContext = createContext(makeContext("Static"));

export const getContext = () => useContext(GlobalContext);
