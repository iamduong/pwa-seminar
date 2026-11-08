import HybridMap from "#components/map/HybridMap";
import { useLocation } from "#hooks/use-location";
import { usePoiData } from "#hooks/use-poi-data";
import { useState } from "react";
import type { PublicPoi } from "../../../types/Poi";
import { PoiMapPreviewCard } from "../components/PoiMapPreviewCard";

export default function MobilePlacesPage() {
  const { coordinate } = useLocation();
  const { pois: poiMarkers } = usePoiData();
  const [selectedPoi, setSelectedPoi] = useState<PublicPoi | null>(null);

  if (!coordinate) return;

  return (
    <section className="h-full w-full">
      <HybridMap
        className="h-full min-h-0 w-full rounded-none border-0"
        initialCenter={[coordinate.long, coordinate.lat]}
        poiMarkers={poiMarkers}
        clientLocation={[coordinate.long, coordinate.lat]}
        onClickPoiMarker={setSelectedPoi}
      />
      {selectedPoi && (
        <PoiMapPreviewCard
          poi={selectedPoi}
          onClose={() => setSelectedPoi(null)}
        />
      )}
    </section>
  );
}
