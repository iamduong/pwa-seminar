import { createContext } from "react";

import type { PublicPoi } from "../../types/Poi";

export type PoiDataContextValue = {
  pois: PublicPoi[];
  loading: boolean;
  errorMessage: string | null;
};

export const PoiDataContext = createContext<PoiDataContextValue | null>(null);
