import { MapPinIcon } from "lucide-react";
import { useNavigate } from "react-router";

import { usePoiData } from "#hooks/use-poi-data";

export default function MobilePoiDirectoryPage() {
  const navigate = useNavigate();
  const { pois, loading, errorMessage } = usePoiData();

  if (loading && pois.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Đang tải địa điểm…</p>;
  }

  if (errorMessage && pois.length === 0) {
    return <p className="py-12 text-center text-sm text-destructive">{errorMessage}</p>;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Khám phá địa điểm</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Chọn một địa điểm để xem hình ảnh và nghe thuyết minh.
        </p>
      </div>

      <div className="space-y-4">
        {pois.map((poi) => (
          <button
            key={poi.id}
            type="button"
            className="group relative block aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted text-left shadow-sm"
            onClick={() => navigate(`/dia-diem/${poi.id}`)}
          >
            {poi.images[0] ? (
              <img
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                src={poi.images[0]}
                alt={poi.name}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Chưa có hình ảnh
              </div>
            )}
            <span className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-4 text-white">
              <span className="block text-lg font-semibold">{poi.name}</span>
              <span className="mt-1 flex items-center gap-1 text-xs text-white/85">
                <MapPinIcon className="size-3.5" aria-hidden="true" />
                <span className="line-clamp-1">{poi.address}</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
