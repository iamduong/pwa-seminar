import { InfoIcon, NavigationIcon, XIcon } from "lucide-react";
import { useNavigate } from "react-router";

import { Button } from "#components/ui/button";
import { useUiBundle } from "#hooks/use-ui-bundle";
import type { PublicPoi } from "../../../types/Poi";

type PoiMapPreviewCardProps = {
  poi: PublicPoi;
  onClose: () => void;
  onClickCoodinate: () => void;
  hasRoute: boolean;
  onClearRoute: () => void;
};

export function PoiMapPreviewCard({
  poi,
  onClose,
  onClickCoodinate,
  hasRoute,
  onClearRoute,
}: PoiMapPreviewCardProps) {
  const navigate = useNavigate();
  const { t } = useUiBundle();
  const coverImage = poi.images[0];

  return (
    <article className="fixed inset-x-4 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.75rem)] z-40 mx-auto w-auto max-w-122">
      <button
        type="button"
        className="absolute -top-6 right-3 z-10 flex h-6 items-center gap-1 rounded-t-lg bg-foreground px-2.5 text-[12px] font-medium text-background shadow-sm"
        onClick={onClose}
        aria-label={t("poi.preview.closeAria")}
      >
        {t("poi.preview.close")}
      </button>

      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] overflow-hidden rounded-2xl border bg-card shadow-xl">
        <div className="h-full min-h-36 bg-muted">
          {coverImage ? (
            <img
              className="h-full w-full object-cover"
              src={coverImage}
              alt={poi.name}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
              {t("places.noImage")}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary">{poi.category_name}</p>
            <h2 className="mt-1 line-clamp-2 text-lg font-semibold">{poi.name}</h2>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {poi.address}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              className="h-10 rounded-full"
              type="button"
              onClick={() => navigate(`/dia-diem/${poi.id}`)}
            >
              <InfoIcon aria-hidden="true" />
              {t("poi.details")}
            </Button>
            {hasRoute ? (
              <Button
                className="h-10 rounded-full"
                type="button"
                variant="outline"
                onClick={onClearRoute}
              >
                <XIcon aria-hidden="true" />
                Tắt chỉ đường
              </Button>
            ) : (
              <Button
                className="h-10 rounded-full"
                type="button"
                variant="outline"
                onClick={onClickCoodinate}
              >
                <NavigationIcon aria-hidden="true" />
                {t("poi.directions")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
