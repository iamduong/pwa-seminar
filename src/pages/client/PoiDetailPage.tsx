import { ArrowLeftIcon, NavigationIcon } from "lucide-react";
import { useEffect, useRef, useState, type UIEvent } from "react";
import { useNavigate, useParams } from "react-router";

import { Button } from "#components/ui/button";
import { usePoiData } from "#hooks/use-poi-data";
import { useUiBundle } from "#hooks/use-ui-bundle";

function resolveMediaUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (apiBaseUrl?.startsWith("http")) {
    return new URL(url, apiBaseUrl).toString();
  }

  return url;
}

export default function PoiDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pois, loading } = usePoiData();
  const { t } = useUiBundle();
  const poi = pois.find((item) => item.id === id);
  const [activeImage, setActiveImage] = useState(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = `${poi?.name ?? t("page.places.title")} | Quan4 Tourism`;
  }, [poi?.name, t]);

  function handleImageScroll(event: UIEvent<HTMLDivElement>) {
    const width = event.currentTarget.clientWidth;
    if (!width) return;
    setActiveImage(Math.round(event.currentTarget.scrollLeft / width));
  }

  if (!poi) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground">
          {loading ? t("places.loading") : t("poi.notFound")}
        </p>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeftIcon aria-hidden="true" />
          {t("poi.back")}
        </Button>
      </div>
    );
  }

  const images = poi.images.filter(Boolean);

  return (
    <article className="min-h-dvh bg-background">
      <div className="relative bg-muted">
        <button
          type="button"
          className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 z-20 flex size-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
          onClick={() => navigate(-1)}
          aria-label={t("poi.back")}
        >
          <ArrowLeftIcon aria-hidden="true" />
        </button>

        {images.length > 0 ? (
          <div
            ref={carouselRef}
            className="flex h-[52dvh] snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={handleImageScroll}
          >
            {images.map((image, index) => (
              <img
                key={`${image}-${index}`}
                className="h-full min-w-full snap-center object-cover"
                src={image}
                alt={t("poi.imageAlt", { name: poi.name, index: index + 1 })}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-[45dvh] items-center justify-center text-sm text-muted-foreground">
            {t("places.noImage")}
          </div>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-3 py-2 backdrop-blur-sm">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`size-2 rounded-full transition-colors ${
                  index === activeImage ? "bg-white" : "bg-white/45"
                }`}
                onClick={() =>
                  carouselRef.current?.scrollTo({
                    left: carouselRef.current.clientWidth * index,
                    behavior: "smooth",
                  })
                }
                aria-label={t("poi.viewImage", { index: index + 1 })}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative -mt-5 space-y-6 rounded-t-3xl bg-background px-5 pt-7 pb-10">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">{poi.category_name}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{poi.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{poi.address}</p>
          </div>
          <Button
            type="button"
            size="icon-lg"
            variant="ghost"
          onClick={() => navigate(`/?poi=${encodeURIComponent(poi.id)}`)}
          title={t("poi.directions")}
          aria-label={`${t("poi.directions")} ${poi.name}`}
          >
            <NavigationIcon className="text-primary" aria-hidden="true" />
          </Button>
        </header>

        <section>
          <h2 className="mb-2 font-semibold">{t("poi.introduction")}</h2>
          <p className="text-base leading-7 text-foreground/85">{poi.description}</p>
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <h2 className="font-semibold">{t("poi.audioTitle")}</h2>
          {poi.audio_url ? (
            <audio
              className="mt-3 w-full"
              controls
              preload="metadata"
              src={resolveMediaUrl(poi.audio_url)}
            />
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("poi.audioUnavailable")}
            </p>
          )}
        </section>
      </div>
    </article>
  );
}
