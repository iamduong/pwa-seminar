import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ProfileSession, Role } from "../types/Authorize";
import { authorizeService } from "../services/AuthorizeService";
import { AxiosError } from "axios";

export type AuthorizeStatus = "checking" | "authenticated" | "unauthenticated" | "error";

export type OwnerRegistrationFormated = {
  bussiness_name: string;
  bussiness_address: string;
  admin_note: string | null;
  status: "pending" | "approved" | "rejected";
}

export type ProfileSessionFormated = {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  isActive: boolean;
  isPoiOwnerVerified: boolean;
  poiOwner: OwnerRegistrationFormated | null;
  role: Role | null;
}

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

// Start of the AuthorizeProvider component

export type AuthorizeContextValue = {
  status: AuthorizeStatus;
  session: ProfileSessionFormated | null;
  refreshProfile: () => Promise<boolean>;
  clearSession: () => void;
}

const AuthorizeContext = createContext<AuthorizeContextValue | null>(null);

const AuthorizeProvider = ({ children }: { children: React.ReactNode }) => {
  const initialize = useRef<boolean>(false);
  const [status, setStatus] = useState<AuthorizeStatus>(() =>
    localStorage.getItem("PWA_SESSION") ? "checking" : "unauthenticated"
  );
  const [session, setSession] = useState<ProfileSessionFormated | null>(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem("PWA_SESSION");
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
      localStorage.setItem("PWA_SESSION", JSON.stringify(profileData));
      setSession(toFormated(profileData));
      setStatus("authenticated");
      return true;
    } catch (error: unknown) {
      localStorage.removeItem("PWA_SESSION");
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
    if (!initialize.current) {
      initialize.current = true;

      const stored = localStorage.getItem("PWA_SESSION");
      if (!stored) return;

      void refreshProfile();
    }
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

const useAuthorize = () => {
  const context = useContext(AuthorizeContext);
  if (!context) {
    throw new Error("useAuthorize must be used within an AuthorizeProvider");
  }
  return context;
}

export { AuthorizeProvider, useAuthorize };
