import { createContext, useContext } from "react";

export interface UserRole {
  id_rol: number;
  nombre: string;
}

export interface UserAccessProfile {
  id: string;
  correo: string;
  nombre: string;
  apellido: string;
  roles: UserRole[];
  permisos: string[];
}

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthContextValue {
  configured: boolean;
  profile: UserAccessProfile | null;
  status: AuthStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }

  return context;
}
