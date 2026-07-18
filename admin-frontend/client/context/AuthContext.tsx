import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as apiLogin, getProfile } from "../lib/api";

export type Role = "guest" | "user" | "admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  token: string | null;
  role: Role;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  loginAdmin: (credentials: any) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isAdminRole(role: unknown) {
  return String(role || "").toLowerCase() === "admin";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    role: "guest",
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("powerflow.token");
      if (token) {
        try {
          const { user } = await getProfile();
          if (!isAdminRole(user.role)) {
            throw new Error("Not an admin");
          }
          setState({
            user,
            token,
            role: "admin",
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          setState({
            user: null,
            token: null,
            role: "guest",
            isAuthenticated: false,
            loading: false,
            error: error.message,
          });
          localStorage.removeItem("powerflow.token");
          localStorage.removeItem("powerflow.adminKey");
        }
      } else {
        setState((prevState) => ({ ...prevState, loading: false }));
      }
    };
    checkAuth();
  }, []);

  const loginAdmin = async (credentials: any) => {
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      const { token, user } = await apiLogin(credentials);
      // Trust server-validated role only. Admin key is checked by the backend.
      if (!isAdminRole(user.role)) {
        throw new Error("Not an admin");
      }
      localStorage.setItem("powerflow.token", token);
      localStorage.removeItem("powerflow.adminKey");
      setState({
        user,
        token,
        role: "admin",
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      return true;
    } catch (error: any) {
      setState((prevState) => ({ ...prevState, loading: false, error: error.message }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("powerflow.token");
    localStorage.removeItem("powerflow.adminKey");
    setState({
      user: null,
      token: null,
      role: "guest",
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      loginAdmin,
      logout,
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
