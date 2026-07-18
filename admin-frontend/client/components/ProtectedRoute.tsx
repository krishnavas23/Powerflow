import { useAuth } from "../context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const { isAuthenticated, role, loading } = useAuth();
  console.log("ProtectedRoute: isAuthenticated:", isAuthenticated, "role:", role, "loading:", loading);

  if (loading) {
    console.log("ProtectedRoute: Loading...");
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!isAuthenticated || role !== 'admin') {
    console.log("ProtectedRoute: Not authenticated or not admin, redirecting to /login.");
    return <Navigate to="/login" replace />;
  }

  console.log("ProtectedRoute: Authenticated and admin, rendering Outlet.");
  return <Outlet />;
}
