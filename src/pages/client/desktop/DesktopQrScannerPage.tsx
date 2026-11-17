import { useUiBundle } from "#hooks/use-ui-bundle"

export default function DesktopQrScannerPage() {
  const { t } = useUiBundle()

  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight">{t("page.qr.title")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("page.qr.description")}
      </p>
    </section>
  )
}
