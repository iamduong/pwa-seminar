import HybridMap from "#components/map/HybridMap";
import { useLocation } from "#hooks/use-location";
import { usePoiData } from "#hooks/use-poi-data";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type { PublicPoi } from "../../../types/Poi";
import { PoiMapPreviewCard } from "../components/PoiMapPreviewCard";
import useQuery from "#hooks/use-query";
import axios from "axios";
import type { MapCoordinates } from "../../../components/map/lib/map-type";

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{
    geometry?: {
      coordinates?: MapCoordinates[];
    };
  }>;
};

export default function MobilePlacesPage() {
  const { execute } = useQuery();

  const { coordinate } = useLocation();
  const { pois: poiMarkers } = usePoiData();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusedPoi = poiMarkers.find((poi) => poi.id === searchParams.get("poi"));
  const focusedLocation = useMemo(
    () => focusedPoi
      ? { location: focusedPoi.location.coordinates, isFocus: true, zoom: 18 }
      : undefined,
    [focusedPoi],
  );

  const [selectedPoi, setSelectedPoi] = useState<PublicPoi | null>(null);

  const [geometryCoordinates, setGeometryCoordinates] =
    useState<MapCoordinates[]>();

  const handleCoodinate = useCallback(async () => {
    if (!selectedPoi || !coordinate) return;

    await execute(
      async () => {
        const { data } = await axios.get<OsrmRouteResponse>(
          `https://router.project-osrm.org/route/v1/driving/${coordinate.long},${coordinate.lat};${selectedPoi.location.coordinates[0]},${selectedPoi.location.coordinates[1]}?overview=full&geometries=geojson`,
        );
        const routeCoordinates = data.routes?.[0]?.geometry?.coordinates;
        if (data.code !== "Ok" || !routeCoordinates || routeCoordinates.length < 2) {
          throw new Error("Không tìm thấy tuyến đường tới địa điểm này.");
        }
        setGeometryCoordinates(routeCoordinates);
      },
      {
        onError: (error) => window.alert(error.message),
      },
    );
  }, [coordinate, execute, selectedPoi]);

  if (!coordinate) return;

  return (
    <section className="h-full w-full">
      <HybridMap
        className="h-full min-h-0 w-full rounded-none border-0"
        initialCenter={[coordinate.long, coordinate.lat]}
        poiMarkers={poiMarkers}
        clientLocation={[coordinate.long, coordinate.lat]}
        selectedLocation={focusedLocation}
        onClickPoiMarker={(poi) => {
          setSelectedPoi(poi);
          setGeometryCoordinates(undefined);
          if (searchParams.has("poi")) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete("poi");
            setSearchParams(nextParams, { replace: true });
          }
        }}
        geometryCoordinates={geometryCoordinates}
      />
      {selectedPoi && (
        <PoiMapPreviewCard
          poi={selectedPoi}
          onClose={() => setSelectedPoi(null)}
          onClickCoodinate={handleCoodinate}
          hasRoute={Boolean(geometryCoordinates?.length)}
          onClearRoute={() => setGeometryCoordinates(undefined)}
        />
      )}
    </section>
  );
}
