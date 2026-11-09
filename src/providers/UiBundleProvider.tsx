import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { UI_FALLBACK_MESSAGES } from "../assets/ui-fallback";
import { useLanguage } from "../hooks/use-language";
import { getCachedUiBundle, saveUiBundle } from "../lib/indexdb";
import { publicService } from "../services/PublicService";
import type { UiMessages, UiTranslationParams } from "../types/UiBundle";
import type { LanguageCode } from "./contexts/language-context";
import { UiBundleContext } from "./contexts/ui-bundle-context";

type UiSnapshot = {
  language: LanguageCode;
  messages: UiMessages;
};

export function UiBundleProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [snapshot, setSnapshot] = useState<UiSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function syncUiBundle() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const cached = await getCachedUiBundle(language);
        if (controller.signal.aborted) return;

        setSnapshot({
          language,
          messages: cached?.value ?? UI_FALLBACK_MESSAGES,
        });

        const response = await publicService.BundleUi(
          language,
          cached?.etag,
          controller.signal,
        );
        if (controller.signal.aborted || response === null) return;
        if (!response.success || !response.data) {
          throw new Error(response.message || "Không thể đồng bộ giao diện.");
        }

        const updated = await saveUiBundle(response.data);
        if (!controller.signal.aborted) {
          setSnapshot({ language, messages: updated.value });
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Không thể đồng bộ giao diện.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void syncUiBundle();
    return () => controller.abort();
  }, [language]);

  const messages =
    snapshot?.language === language ? snapshot.messages : UI_FALLBACK_MESSAGES;
  const t = useCallback(
    (key: string, params?: UiTranslationParams) => {
      const message = messages[key] ?? UI_FALLBACK_MESSAGES[key] ?? key;
      if (!params) return message;

      return message.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
        name in params ? String(params[name]) : placeholder,
      );
    },
    [messages],
  );
  const value = useMemo(
    () => ({ t, loading, errorMessage }),
    [t, loading, errorMessage],
  );

  return (
    <UiBundleContext.Provider value={value}>
      {children}
    </UiBundleContext.Provider>
  );
}
