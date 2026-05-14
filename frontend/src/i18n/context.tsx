import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { locales, Locale, LocaleStrings } from "./locales";

interface I18nContextType {
  locale: Locale;
  t: LocaleStrings;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("stationhub-locale");
    return saved === "en" || saved === "zh" ? saved : "zh";
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("stationhub-locale", newLocale);
  };

  const toggleLocale = () => {
    setLocale(locale === "zh" ? "en" : "zh");
  };

  return (
    <I18nContext.Provider value={{ locale, t: locales[locale], setLocale, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
