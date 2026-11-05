import { useCallback, useEffect, useMemo, useState } from "react";
import { LOCALSTORAGE_SESSION_KEY } from "../assets/config";
import type { ProfileSession } from "../types/Authorize";
import { authorizeService } from "../services/AuthorizeService";
import { AxiosError } from "axios";
import {
  AuthorizeContext,
  type AuthorizeStatus,
  type ProfileSessionFormated,
} from "./contexts/authorize-context";

const toFormated = (session: ProfileSession): ProfileSessionFormated => {
  return {
    userId: session.user_id,
    fullName: session.full_name,
    email: session.email,
    phone: session.phone,
    isActive: session.is_active,
    isPoiOwnerVerified: session.is_poi_owner_verified,
    poiOwner: session.poi_owner ? {
      bussiness_name: session.poi_owner.business_name,
      bussiness_address: session.poi_owner.business_address,
      admin_note: session.poi_owner.admin_note,
      status: session.poi_owner.status,
    } : null,
    role: session.role,
  };
}

export const AuthorizeProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<AuthorizeStatus>(() =>
    localStorage.getItem(LOCALSTORAGE_SESSION_KEY) ? "checking" : "unauthenticated"
  );
  const [session, setSession] = useState<ProfileSessionFormated | null>(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem(LOCALSTORAGE_SESSION_KEY);
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authorizeService.GetProfileSession();
      const profileData = profile?.data;
      if (!profileData) {
        throw new Error("Profile session is null");
      }
      localStorage.setItem(LOCALSTORAGE_SESSION_KEY, JSON.stringify(profileData));
      setSession(toFormated(profileData));
      setStatus("authenticated");
      return true;
    } catch (error: unknown) {
      localStorage.removeItem(LOCALSTORAGE_SESSION_KEY);
      if (error instanceof AxiosError && error.response?.status === 401) {
        setSession(null);
        setStatus("unauthenticated");
      } else {
        setStatus("error");
      }
      return false;
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(LOCALSTORAGE_SESSION_KEY);
    if (!stored) return;

    const timeoutId = window.setTimeout(() => {
      void refreshProfile();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshProfile]);

  const value = useMemo(
    () => ({
      status,
      session,
      refreshProfile,
      clearSession,
    }),
    [status, session, refreshProfile, clearSession]
  );

  return (
    <AuthorizeContext.Provider value={value}>
      {children}
    </AuthorizeContext.Provider>
  );
}
