import { createContext } from "react";

import type { MenuItem } from "../../types/MenuItem";

export type MenuItemDataContextValue = {
  menuItems: MenuItem[];
  loading: boolean;
  errorMessage: string | null;
};

export const MenuItemDataContext = createContext<MenuItemDataContextValue | null>(null);
