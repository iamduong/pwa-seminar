import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  LocationContext,
  type Coordinate,
  type LocationStatus,
} from "./contexts/location-context";

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 5_000,
};

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);
  const [status, setStatus] = useState<LocationStatus>(() =>
    navigator.geolocation ? "checking" : "unsupported",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const watcherRef = useRef<number | null>(null);

  const updateCoordinate = useCallback((position: GeolocationPosition) => {
    setCoordinate({
      long: position.coords.longitude,
      lat: position.coords.latitude,
    });
  }, []);

  const stopWatching = useCallback(() => {
    if (watcherRef.current === null) return;
    navigator.geolocation.clearWatch(watcherRef.current);
    watcherRef.current = null;
  }, []);

  const startWatching = useCallback(() => {
    if (watcherRef.current !== null) return;

    watcherRef.current = navigator.geolocation.watchPosition(
      updateCoordinate,
      (error) => {
        setErrorMessage(error.message);
        if (error.code === error.PERMISSION_DENIED) {
          setStatus("denied");
          stopWatching();
        }
      },
      GEOLOCATION_OPTIONS,
    );
  }, [stopWatching, updateCoordinate]);

  const checkLocationPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    setStatus("checking");
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateCoordinate(position);
        setStatus("ready");
        startWatching();
      },
      (error) => {
        setErrorMessage(error.message);
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "error");
      },
      GEOLOCATION_OPTIONS,
    );
  }, [startWatching, updateCoordinate]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    let permission: PermissionStatus | null = null;
    let cancelled = false;

    const handlePermissionChange = () => {
      if (!permission) return;

      if (permission.state === "granted") {
        checkLocationPermission();
      } else {
        stopWatching();
        setStatus(permission.state);
      }
    };

    if (!navigator.permissions?.query) {
      Promise.resolve().then(() => {
        if (!cancelled) setStatus("prompt");
      });
    } else {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          if (cancelled) return;
          permission = result;
          permission.addEventListener("change", handlePermissionChange);
          handlePermissionChange();
        })
        .catch(() => {
          if (!cancelled) setStatus("prompt");
        });
    }

    return () => {
      cancelled = true;
      permission?.removeEventListener("change", handlePermissionChange);
      stopWatching();
    };
  }, [checkLocationPermission, stopWatching]);

  const value = useMemo(
    () => ({
      coordinate,
      status,
      errorMessage,
      checkLocationPermission,
    }),
    [coordinate, status, errorMessage, checkLocationPermission],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
