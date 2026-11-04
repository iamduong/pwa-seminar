import { createContext } from "react"

export const LANGUAGE_STORAGE_KEY = "PWA_UI_LOCALE"

export const supportedLanguages = [
  { code: "vi", label: "Tiếng Việt", nativeLabel: "Tiếng Việt" },
  { code: "en", label: "Tiếng Anh", nativeLabel: "English" },
] as const

export type LanguageCode = (typeof supportedLanguages)[number]["code"]

export type LanguageContextValue = {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

export function isLanguageCode(value: string | null): value is LanguageCode {
  return supportedLanguages.some((language) => language.code === value)
}
