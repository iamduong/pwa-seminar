import { useUiBundle } from "#hooks/use-ui-bundle"

export default function MobileNearbyPage() {
  const { t } = useUiBundle()

  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight">{t("page.nearby.title")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("page.nearby.description")}
      </p>
    </section>
  )
}
