import { useUiBundle } from "#hooks/use-ui-bundle"

export default function MobileFoodPage() {
  const { t } = useUiBundle()

  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight">{t("page.food.title")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("food.description")}
      </p>
    </section>
  )
}
