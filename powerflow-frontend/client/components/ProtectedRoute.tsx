import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "admin" | "user";
}) {
  const { isAuthenticated, role: current } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/auth?from=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (role === "admin" && current !== "admin") {
    return (
      <Navigate
        to={`/auth?from=${encodeURIComponent(location.pathname)}&reason=admin`}
        replace
      />
    );
  }

  return <>{children}</>;
}
