import axios from "axios";
import { ArrowLeftIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import HybridMap from "#components/map/HybridMap";
import type { MapCoordinates } from "../../../components/map/lib/map-type";
import { Button } from "#components/ui/button";
import { useLocation } from "#hooks/use-location";
import { usePoiData } from "#hooks/use-poi-data";
import { useUiBundle } from "#hooks/use-ui-bundle";
import { getSavedTour } from "../../../services/ClientTourService";
import type { PublicPoi } from "../../../types/Poi";
import { PoiMapPreviewCard } from "../components/PoiMapPreviewCard";

import { distance } from "@turf/distance"
import { point } from "@turf/helpers"

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{ geometry?: { coordinates?: MapCoordinates[] } }>;
};

export default function MobileTourDetailPage() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const { coordinate } = useLocation();
  const { t } = useUiBundle();
  const { pois: cachedPois, loading } = usePoiData();
  const [tour] = useState(() => getSavedTour(code));
  const tourPoiIds = new Set(tour?.pois.map((poi) => poi.id) ?? []);
  const pois = cachedPois.filter((poi) => tourPoiIds.has(poi.id));
  const [selectedPoi, setSelectedPoi] = useState<PublicPoi | null>(null);
  const [route, setRoute] = useState<MapCoordinates[]>();

  async function showDirections() {
    if (!selectedPoi || !coordinate) return;
    try {
      const { data } = await axios.get<OsrmRouteResponse>(
        `https://router.project-osrm.org/route/v1/driving/${coordinate.long},${coordinate.lat};${selectedPoi.location.coordinates[0]},${selectedPoi.location.coordinates[1]}?overview=full&geometries=geojson`,
      );
      const coordinates = data.routes?.[0]?.geometry?.coordinates;
      if (data.code !== "Ok" || !coordinates || coordinates.length < 2) {
        throw new Error(t("poi.route.notFound"));
      }
      setRoute(coordinates);
    } catch (error: unknown) {
      window.alert(error instanceof Error ? error.message : t("poi.route.loadError"));
    }
  }

  if (!tour) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground">{t("travel.detail.notFound")}</p>
        <Button type="button" variant="outline" onClick={() => navigate("/du-lich")}>
          <ArrowLeftIcon aria-hidden="true" /> {t("travel.detail.back")}
        </Button>
      </div>
    );
  }

  if (!coordinate) return null;

  useEffect(() => {
    if (!cachedPois) return;

    var result = 0;
    
    let start = point([cachedPois[0].location.coordinates[0], cachedPois[0].location.coordinates[1]])

    for (let i = 1; i < cachedPois.length; i++) {
      const to =  point([cachedPois[i].location.coordinates[0], cachedPois[i].location.coordinates[1]])

      const d = distance(start, to, { units: "meters" });
      result += d

      start = to;
    }

    console.log(result)
    // alert(result)

  }, [cachedPois]);

  return (
    <section className="relative h-full w-full">
      <HybridMap
        className="h-full min-h-0 w-full rounded-none border-0"
        initialCenter={[coordinate.long, coordinate.lat]}
        poiMarkers={pois}
        clientLocation={[coordinate.long, coordinate.lat]}
        onClickPoiMarker={(poi) => {
          setSelectedPoi(poi);
          setRoute(undefined);
        }}
        geometryCoordinates={route}
      />

      <div className="absolute top-4 right-4 z-30 flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-xl border bg-background/95 p-2 pr-4 shadow-sm">
        <Button type="button" size="icon" variant="ghost" onClick={() => navigate("/du-lich")} aria-label={t("travel.detail.backAria")}>
          <ArrowLeftIcon aria-hidden="true" />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{t("travel.item.title", { code: tour.code })}</p>
          <p className="text-xs text-muted-foreground">
            {loading
              ? t("travel.detail.loading")
              : t("travel.detail.available", { available: pois.length, total: tour.pois.length })}
          </p>
        </div>
      </div>

      {selectedPoi && (
        <PoiMapPreviewCard
          poi={selectedPoi}
          onClose={() => setSelectedPoi(null)}
          onClickCoodinate={() => void showDirections()}
          hasRoute={Boolean(route?.length)}
          onClearRoute={() => setRoute(undefined)}
        />
      )}
    </section>
  );
}
