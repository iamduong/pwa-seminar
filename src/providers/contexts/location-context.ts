import { createContext } from "react";

export type Coordinate = {
  long: number;
  lat: number;
}

export type LocationStatus =
  | "checking"
  | "ready"
  | "prompt"
  | "denied"
  | "unsupported"
  | "error";

export type LocationContextValue = {
  coordinate: Coordinate | null;
  status: LocationStatus;
  errorMessage: string | null;
  checkLocationPermission: () => void;
}

export const LocationContext = createContext<LocationContextValue | null>(null);
