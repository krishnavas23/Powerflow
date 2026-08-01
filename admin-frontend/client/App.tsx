import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/AdminLayout";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import Transactions from "./pages/Transactions";
import Verification from "./pages/Verification";
import Reports from "./pages/Reports";
import PowerBI from "./pages/PowerBI";
import PlatformConfig from "./pages/PlatformConfig";
import Profile from "./pages/Profile";
import SystemSettings from "./pages/SystemSettings";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="transactions" element={<Transactions />} />
                
                <Route path="verification" element={<Verification />} />
                <Route path="reports" element={<Reports />} />
                <Route path="powerbi" element={<PowerBI />} />
                <Route path="profile" element={<Profile />} />
                <Route path="config" element={<PlatformConfig />} />
                <Route path="settings" element={<SystemSettings />} />
                <Route index element={<Navigate to="dashboard" />} />
              </Route>
            </Route>
            {/* Shortcut routes for convenience */}
            <Route
              path="/dashboard"
              element={<Navigate to="/admin/dashboard" />}
            />
            <Route path="/users" element={<Navigate to="/admin/users" />} />
            <Route
              path="/transactions"
              element={<Navigate to="/admin/transactions" />}
            />
            
            <Route
              path="/verification"
              element={<Navigate to="/admin/verification" />}
            />
            <Route path="/reports" element={<Navigate to="/admin/reports" />} />
            <Route path="/powerbi" element={<Navigate to="/admin/powerbi" />} />
            <Route path="/config" element={<Navigate to="/admin/config" />} />
            <Route path="/settings" element={<Navigate to="/admin/settings" />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

const container = document.getElementById("root")!;
const w = window as any;
if (!w.__POWERFLOW_ROOT) {
  w.__POWERFLOW_ROOT = createRoot(container);
}
w.__POWERFLOW_ROOT.render(<App />);
