import { useCallback, useMemo, useState, type ReactNode } from "react";

import { LOCALSTORAGE_LANGUAGE_KEY } from "../assets/config";
import {
  LanguageContext,
  isLanguageCode,
  supportedLanguages,
  type LanguageCode,
} from "./contexts/language-context";

function getInitialLanguage(): LanguageCode {
  console.log("navigator.languages:", navigator.languages);

  const savedLanguage = localStorage.getItem(LOCALSTORAGE_LANGUAGE_KEY);
  if (isLanguageCode(savedLanguage)) return savedLanguage;

  // Check default language used
  const browserLanguage = navigator.languages
    .map((language) => {
      const normalizedLanguage = language.toLowerCase();
      const baseLanguage = normalizedLanguage.split("-")[0];

      return supportedLanguages.find((item) => {
        const supportedLanguage = item.code.toLowerCase();
        return (
          supportedLanguage === normalizedLanguage ||
          supportedLanguage.startsWith(`${baseLanguage}-`)
        );
      })?.code;
    })
    .find((language): language is LanguageCode => language !== undefined);

  return browserLanguage ?? "vi-VN";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(() => isLanguageCode(localStorage.getItem(LOCALSTORAGE_LANGUAGE_KEY)));

  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    localStorage.setItem(LOCALSTORAGE_LANGUAGE_KEY, nextLanguage);
    setLanguageState(nextLanguage);
    setHasSelectedLanguage(true);
  }, []);

  const value = useMemo(
    () => ({ language, hasSelectedLanguage, setLanguage }),
    [language, hasSelectedLanguage, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
