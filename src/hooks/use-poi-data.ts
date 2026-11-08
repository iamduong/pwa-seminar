import { useContext } from "react";

import { PoiDataContext } from "../providers/contexts/poi-data-context";

export function usePoiData() {
  const context = useContext(PoiDataContext);

  if (!context) {
    throw new Error("usePoiData must be used within a PoiDataProvider");
  }

  return context;
}
