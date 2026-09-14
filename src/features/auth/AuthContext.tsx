import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import api from "../../services/api";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import {
  AuthContext,
  type AuthStatus,
  type UserAccessProfile,
} from "./auth-context";

const INVALID_CREDENTIALS_MESSAGE = "Correo o contraseña incorrectos.";

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "Tu cuenta no está habilitada para acceder al sistema.";
    }

    if (error.response?.status === 503) {
      return "No pudimos validar tu acceso. Inténtalo nuevamente.";
    }
  }

  return "No pudimos iniciar sesión. Verifica tu conexión e inténtalo nuevamente.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [profile, setProfile] = useState<UserAccessProfile | null>(null);

  const loadAuthorizedProfile = useCallback(async () => {
    const response = await api.get<UserAccessProfile>("auth/me/");
    setProfile(response.data);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!supabase) {
        if (active) setStatus("anonymous");
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error || !data.session) {
        setProfile(null);
        setStatus("anonymous");
        return;
      }

      try {
        await loadAuthorizedProfile();
      } catch {
        await supabase.auth.signOut();
        if (active) {
          setProfile(null);
          setStatus("anonymous");
        }
      }
    }

    void restoreSession();

    const authListener = supabase?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && active) {
        setProfile(null);
        setStatus("anonymous");
      }
    });

    return () => {
      active = false;
      authListener?.data.subscription.unsubscribe();
    };
  }, [loadAuthorizedProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        throw new Error("Supabase Auth no está configurado.");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        throw new Error(INVALID_CREDENTIALS_MESSAGE);
      }

      try {
        await loadAuthorizedProfile();
      } catch (error) {
        await supabase.auth.signOut();
        throw new Error(getApiErrorMessage(error), { cause: error });
      }
    },
    [loadAuthorizedProfile],
  );

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        throw new Error("No pudimos cerrar la sesión. Inténtalo nuevamente.");
      }
    }
    setProfile(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({
      configured: isSupabaseConfigured,
      profile,
      status,
      signIn,
      signOut,
      refreshProfile: loadAuthorizedProfile,
    }),
    [loadAuthorizedProfile, profile, signIn, signOut, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
