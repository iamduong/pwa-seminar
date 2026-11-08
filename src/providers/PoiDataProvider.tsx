import { useEffect, useMemo, useState, type ReactNode } from "react";

import { useLanguage } from "#hooks/use-language";
import { getCachedPoi, savePoi } from "#lib/indexdb";
import { publicService } from "../services/PublicService";
import type { PublicPoi } from "../types/Poi";
import { PoiDataContext } from "./contexts/poi-data-context";
import type { LanguageCode } from "./contexts/language-context";

type PoiSnapshot = {
  language: LanguageCode;
  pois: PublicPoi[];
};

export function PoiDataProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [snapshot, setSnapshot] = useState<PoiSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function syncPoiData() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const cached = await getCachedPoi(language);
        if (controller.signal.aborted) return;

        setSnapshot({ language, pois: cached?.pois ?? [] });

        const response = await publicService.BundlePoi(
          language,
          cached?.updated_after ?? null,
          cached?.etag,
          controller.signal,
        );

        if (controller.signal.aborted || response === null) return;
        if (!response.success || !response.data) {
          throw new Error(response.message || "Không thể đồng bộ dữ liệu POI.");
        }

        const updated = await savePoi(
          language,
          response.data,
          !cached || cached.updated_after == null,
        );

        if (!controller.signal.aborted) {
          setSnapshot({ language, pois: updated.pois });
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể đồng bộ dữ liệu POI.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void syncPoiData();
    return () => controller.abort();
  }, [language]);

  const value = useMemo(
    () => ({
      pois: snapshot?.language === language ? snapshot.pois : [],
      loading,
      errorMessage,
    }),
    [snapshot, language, loading, errorMessage],
  );

  return (
    <PoiDataContext.Provider value={value}>{children}</PoiDataContext.Provider>
  );
}
