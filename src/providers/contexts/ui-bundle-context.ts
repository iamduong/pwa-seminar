import { createContext } from "react";

import type { UiTranslationParams } from "../../types/UiBundle";

export type Translate = (
  key: string,
  params?: UiTranslationParams,
) => string;

export type UiBundleContextValue = {
  t: Translate;
  loading: boolean;
  errorMessage: string | null;
};

export const UiBundleContext = createContext<UiBundleContextValue | null>(null);
