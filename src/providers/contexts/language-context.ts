import { createContext } from "react"

import { MY_MEMORY_LANGUAGES } from "../../assets/config"

export type LanguageCode = (typeof MY_MEMORY_LANGUAGES)[number]

const languageDetails: Record<
  LanguageCode,
  { label: string; nativeLabel: string }
> = {
  "vi-VN": { label: "Tiếng Việt", nativeLabel: "Tiếng Việt" },
  "en-US": { label: "Tiếng Anh", nativeLabel: "English" },
  "zh-CN": { label: "Tiếng Trung", nativeLabel: "简体中文" },
  "ja-JP": { label: "Tiếng Nhật", nativeLabel: "日本語" },
  "ko-KR": { label: "Tiếng Hàn", nativeLabel: "한국어" },
}

export const supportedLanguages = MY_MEMORY_LANGUAGES.map((code) => ({
  code,
  ...languageDetails[code],
}))

export type LanguageContextValue = {
  language: LanguageCode
  hasSelectedLanguage: boolean
  setLanguage: (language: LanguageCode) => void
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

export function isLanguageCode(value: string | null): value is LanguageCode {
  return MY_MEMORY_LANGUAGES.some((language) => language === value)
}
