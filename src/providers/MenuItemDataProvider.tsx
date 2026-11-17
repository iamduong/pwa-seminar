import { useEffect, useMemo, useState, type ReactNode } from "react";

import { useLanguage } from "#hooks/use-language";
import { useUiBundle } from "#hooks/use-ui-bundle";
import { getCachedMenuItems, saveMenuItems } from "#lib/indexdb";
import { publicService } from "../services/PublicService";
import type { MenuItem } from "../types/MenuItem";
import { MenuItemDataContext } from "./contexts/menu-item-data-context";
import type { LanguageCode } from "./contexts/language-context";

type MenuItemSnapshot = {
  language: LanguageCode;
  menuItems: MenuItem[];
};

export function MenuItemDataProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const { t } = useUiBundle();
  const [snapshot, setSnapshot] = useState<MenuItemSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function syncMenuItems() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const cached = await getCachedMenuItems(language);
        if (controller.signal.aborted) return;
        setSnapshot({ language, menuItems: cached?.menu_items ?? [] });

        const response = await publicService.BundleMenuItem(
          language,
          cached?.etag,
          controller.signal,
        );
        if (controller.signal.aborted || response === null) return;
        if (!response.success || !response.data) {
          throw new Error(t("data.menuItemSyncError"));
        }

        const updated = await saveMenuItems(language, response.data);
        if (!controller.signal.aborted) {
          setSnapshot({ language, menuItems: updated.menu_items });
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        setErrorMessage(
          error instanceof Error ? error.message : t("data.menuItemSyncError"),
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void syncMenuItems();
    return () => controller.abort();
  }, [language]);

  const value = useMemo(
    () => ({
      menuItems: snapshot?.language === language ? snapshot.menuItems : [],
      loading,
      errorMessage,
    }),
    [snapshot, language, loading, errorMessage],
  );

  return (
    <MenuItemDataContext.Provider value={value}>
      {children}
    </MenuItemDataContext.Provider>
  );
}
