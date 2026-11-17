import {
  CalendarClockIcon,
  ChevronRightIcon,
  MapPinIcon,
  QrCodeIcon,
  UsersIcon,
} from "lucide-react";
import { useNavigate } from "react-router";

import { Button } from "#components/ui/button";
import { useLanguage } from "#hooks/use-language";
import { useUiBundle } from "#hooks/use-ui-bundle";
import { getSavedTours } from "../../../services/ClientTourService";

export default function MobileTourListPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { t } = useUiBundle();
  const tours = getSavedTours();
  const dateFormatter = new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("travel.list.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("travel.list.description")}
          </p>
        </div>
        <Button
          type="button"
          size="icon-lg"
          onClick={() => navigate("/du-lich/quet-qr")}
          aria-label={t("travel.scan.ariaLabel")}
          title={t("travel.scan.title")}
        >
          <QrCodeIcon aria-hidden="true" />
        </Button>
      </header>

      {tours.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-5 py-12 text-center">
          <QrCodeIcon className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
          <h3 className="mt-4 font-semibold">{t("travel.empty.title")}</h3>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            {t("travel.empty.description")}
          </p>
          <Button className="mt-5" type="button" onClick={() => navigate("/du-lich/quet-qr")}>
            <QrCodeIcon aria-hidden="true" />
            {t("travel.scan.action")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tours.map((tour) => (
            <button
              key={tour.id}
              type="button"
              className="flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/50"
              onClick={() => navigate(`/du-lich/${encodeURIComponent(tour.code)}`)}
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPinIcon aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{t("travel.item.title", { code: tour.code })}</span>
                <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="size-3.5" aria-hidden="true" />
                    {t("travel.item.destinations", { count: tour.pois.length })}
                  </span>
                  <span className="flex items-center gap-1">
                    <UsersIcon className="size-3.5" aria-hidden="true" />
                    {t("travel.item.guests", { count: tour.max_people })}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarClockIcon className="size-3.5" aria-hidden="true" />
                    {t("travel.item.expiresAt", { date: dateFormatter.format(new Date(tour.expires_at)) })}
                  </span>
                </span>
              </span>
              <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
