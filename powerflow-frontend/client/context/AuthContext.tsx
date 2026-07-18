import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BACKEND_BASE_URL } from "@shared/api";

export type Role = "guest" | "user" | "admin";

interface AuthState {
  role: Role;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  loginUser: () => void;
  loginAdmin: (code: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "powerflow.auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    role: "guest",
    isAuthenticated: false,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    // If a token exists, hydrate auth state and user info from backend
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        // mark as authenticated optimistically so protected routes render
        setState((s) => ({ ...s, isAuthenticated: true, role: s.role === 'guest' ? 'user' : s.role }));
        const res = await fetch(`${BACKEND_BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const p = await res.json();
          const mergedUser = {
            name: p.name,
            email: p.email,
            phone: p.phone,
            address: p.address,
            city: p.city,
            country: p.country,
            avatar: p.avatarUrl,
            kycStatus: p.kycStatus,
          };
          try { localStorage.setItem("powerflow.user", JSON.stringify(mergedUser)); } catch {}
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      loginUser: () => setState({ role: "user", isAuthenticated: true }),
      loginAdmin: (_code: string) => {
        // Admin access must come from a successful backend login (JWT + Admin role).
        // Do not gate admin UI with a client-side shared secret.
        return false;
      },
      logout: () => setState({ role: "guest", isAuthenticated: false }),
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
