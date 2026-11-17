import { useContext } from "react";

import { MenuItemDataContext } from "../providers/contexts/menu-item-data-context";

export function useMenuItemData() {
  const context = useContext(MenuItemDataContext);
  if (!context) {
    throw new Error("useMenuItemData must be used within a MenuItemDataProvider");
  }
  return context;
}
