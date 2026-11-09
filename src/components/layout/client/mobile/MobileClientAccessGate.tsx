import { ChevronRightIcon, LocateFixedIcon, RefreshCwIcon } from "lucide-react"
import { Outlet } from "react-router"

import { Button } from "#components/ui/button"
import { useLanguage } from "#hooks/use-language"
import { useLocation } from "#hooks/use-location"
import { useIsMobile } from "#hooks/use-mobile"
import { useUiBundle } from "#hooks/use-ui-bundle"
import { LocationProvider } from "../../../../providers/LocationProvider"
import { supportedLanguages } from "../../../../providers/contexts/language-context"

function FullScreenCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/50 p-5">
      <section className="w-full max-w-sm rounded-3xl border bg-background p-6 shadow-xl">
        {children}
      </section>
    </main>
  )
}

function LanguageSelection() {
  const { language, setLanguage } = useLanguage()
  const { t } = useUiBundle()
  const languageNames = new Intl.DisplayNames([language], { type: "language" })

  return (
    <main className="fixed inset-0 z-100 flex h-dvh flex-col overflow-hidden bg-background px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="shrink-0 text-left">
        <p className="text-sm font-medium text-muted-foreground">Quan4 Tourism</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t("language.select.title")}</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          {t("language.select.description")}
        </p>
      </header>

      <div
        className="mt-24 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-1 pb-2"
        role="radiogroup"
        aria-label={t("language.select.ariaLabel")}
      >
        {supportedLanguages.map((item) => (
          <button
            key={item.code}
            className="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-muted active:bg-muted"
            type="button"
            onClick={() => setLanguage(item.code)}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold uppercase">
              {item.code.split("-")[0]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{item.nativeLabel}</span>
              <span className="block text-xs text-muted-foreground">
                {languageNames.of(item.code) ?? item.label}
              </span>
            </span>
            <ChevronRightIcon
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </main>
  )
}

function LocationPermission() {
  const { status, checkLocationPermission } = useLocation()
  const { t } = useUiBundle()

  if (status === "ready") return <Outlet />

  const statusMessage =
    status === "denied"
      ? t("location.permission.denied")
      : status === "unsupported"
        ? t("location.permission.unsupported")
        : status === "error"
          ? t("location.permission.error")
          : t("location.permission.description")

  return (
    <FullScreenCard>
      <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <LocateFixedIcon className="size-6" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold">{t("location.permission.title")}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{statusMessage}</p>

      <Button
        className="mt-6 h-11 w-full rounded-xl"
        type="button"
        onClick={checkLocationPermission}
        disabled={status === "checking" || status === "unsupported"}
      >
        <RefreshCwIcon
          className={status === "checking" ? "animate-spin" : ""}
          aria-hidden="true"
        />
        {status === "checking"
          ? t("location.permission.checking")
          : t("location.permission.check")}
      </Button>
    </FullScreenCard>
  )
}

function ClientLocationGate({ isMobile }: { isMobile: boolean }) {
  return isMobile ? <LocationPermission /> : <Outlet />
}

export function MobileClientAccessGate() {
  const isMobile = useIsMobile()
  const { hasSelectedLanguage } = useLanguage()

  if (isMobile && !hasSelectedLanguage) return <LanguageSelection />

  return (
    <LocationProvider>
      <ClientLocationGate isMobile={isMobile} />
    </LocationProvider>
  )
}
