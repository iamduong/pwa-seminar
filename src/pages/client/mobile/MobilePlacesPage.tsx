import HybridMap from "#components/map/HybridMap";
import { useLocation } from "#hooks/use-location";

export default function MobilePlacesPage() {
  const { coordinate } = useLocation();

  if (!coordinate) return;

  return (
    <section className="pb-10">
      <HybridMap className="h-[calc(100dvh-12.25rem)] w-full" initialCenter={[coordinate.long, coordinate.lat]} showGeolocation={false} />
    </section>
  )
}
