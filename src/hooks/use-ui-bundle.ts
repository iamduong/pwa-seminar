import { useContext } from "react";

import { UI_FALLBACK_MESSAGES } from "../assets/ui-fallback";
import {
  UiBundleContext,
  type Translate,
} from "../providers/contexts/ui-bundle-context";

export const fallbackTranslate: Translate = (key, params) => {
  const message = UI_FALLBACK_MESSAGES[key] ?? key;
  if (!params) return message;

  return message.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
};

export function useUiBundle() {
  const context = useContext(UiBundleContext);

  return context ?? {
    t: fallbackTranslate,
    loading: false,
    errorMessage: null,
  };
}
