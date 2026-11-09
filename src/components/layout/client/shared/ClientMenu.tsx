import {
  ArrowLeftIcon,
  BellRingIcon,
  CheckIcon,
  ChevronRightIcon,
  HeadphonesIcon,
  LanguagesIcon,
  MapIcon,
  MenuIcon,
  StoreIcon,
} from "lucide-react"
import { useState } from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "#components/ui/sheet"
import { useLanguage } from "#hooks/use-language"
import { useUiBundle } from "#hooks/use-ui-bundle"
import { supportedLanguages } from "../../../../providers/contexts/language-context"

export function ClientMenu({ triggerClassName }: { triggerClassName: string }) {
  const { language, setLanguage } = useLanguage()
  const { t } = useUiBundle()
  const [isOpen, setIsOpen] = useState(false)
  const [showLanguageOptions, setShowLanguageOptions] = useState(false)
  const selectedLanguage = supportedLanguages.find(
    (item) => item.code === language,
  )
  const languageNames = new Intl.DisplayNames([language], { type: "language" })

  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (!open) setShowLanguageOptions(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <button
            className={triggerClassName}
            type="button"
            aria-label={t("menu.open")}
          />
        }
      >
        <MenuIcon className="size-5" aria-hidden="true" />
        <span className="max-w-full truncate">{t("menu.label")}</span>
      </SheetTrigger>

      <SheetContent className="w-[min(86vw,22rem)]" side="right">
        <SheetHeader className="border-b px-5 py-5">
          {showLanguageOptions ? (
            <div className="flex items-start gap-3 pr-8">
              <button
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                type="button"
                onClick={() => setShowLanguageOptions(false)}
                aria-label={t("menu.back")}
              >
                <ArrowLeftIcon className="size-4" aria-hidden="true" />
              </button>
              <div>
                <SheetTitle>{t("language.select.title")}</SheetTitle>
                <SheetDescription>
                  {t("menu.language.description")}
                </SheetDescription>
              </div>
            </div>
          ) : (
            <>
              <SheetTitle>{t("menu.utilities.title")}</SheetTitle>
              <SheetDescription>
                {t("menu.utilities.description")}
              </SheetDescription>
            </>
          )}
        </SheetHeader>

        {showLanguageOptions ? (
          <div
            className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4"
            role="radiogroup"
            aria-label={t("menu.language.ariaLabel")}
          >
            {supportedLanguages.map((item) => {
              const isSelected = item.code === language

              return (
                <button
                  key={item.code}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-4 text-left transition-colors hover:bg-muted active:bg-muted ${
                    isSelected ? "bg-muted" : ""
                  }`}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setLanguage(item.code)}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-xs font-bold uppercase ring-1 ring-border">
                    {item.code}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {languageNames.of(item.code) ?? item.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {item.nativeLabel}
                    </span>
                  </span>
                  {isSelected && (
                    <CheckIcon className="size-5 text-primary" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            <button
              className="flex w-full items-center gap-3 rounded-xl px-3 py-4 text-left transition-colors hover:bg-muted active:bg-muted"
              type="button"
              onClick={() => setShowLanguageOptions(true)}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                <LanguagesIcon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t("menu.language.title")}</span>
                <span className="block text-xs text-muted-foreground">
                  {selectedLanguage?.nativeLabel}
                </span>
              </span>
              <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-xl px-3 py-4 text-left transition-colors hover:bg-muted active:bg-muted"
              type="button"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                <MapIcon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t("menu.offlineMap.title")}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t("menu.offlineMap.description")}
                </span>
              </span>
              <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-xl px-3 py-4 text-left transition-colors hover:bg-muted active:bg-muted"
              type="button"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                <HeadphonesIcon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t("menu.offlineAudio.title")}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t("menu.offlineAudio.description")}
                </span>
              </span>
              <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-xl px-3 py-4 text-left transition-colors hover:bg-muted active:bg-muted"
              type="button"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                <BellRingIcon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t("menu.notifications.title")}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t("menu.notifications.description")}
                </span>
              </span>
              <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            </button>

            <a
              className="flex items-center gap-3 rounded-xl px-3 py-4 transition-colors hover:bg-muted active:bg-muted"
              href="/quan-ly/dang-ky"
              target="_blank"
              rel="noreferrer"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                <StoreIcon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t("menu.ownerRegistration.title")}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t("menu.ownerRegistration.description")}
                </span>
              </span>
              <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            </a>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
