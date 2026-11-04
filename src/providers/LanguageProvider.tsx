import { useCallback, useMemo, useState, type ReactNode } from "react"

import {
  LANGUAGE_STORAGE_KEY,
  LanguageContext,
  isLanguageCode,
  type LanguageCode,
} from "./language-context"

function getInitialLanguage(): LanguageCode {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (isLanguageCode(savedLanguage)) return savedLanguage

  const browserLanguage = navigator.languages
    .map((language) => language.split("-")[0])
    .find(isLanguageCode)

  return browserLanguage ?? "vi"
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage)

  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
    setLanguageState(nextLanguage)
  }, [])

  const value = useMemo(
    () => ({ language, setLanguage }),
    [language, setLanguage],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
