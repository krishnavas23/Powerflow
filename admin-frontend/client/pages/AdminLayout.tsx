import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const pageRoutes: { [key: string]: string } = {
  "/admin/dashboard": "Dashboard",
  "/admin/users": "User Management",
  "/admin/transactions": "Transactions",
  "/admin/verification": "Verifications",
  "/admin/reports": "EDA & KPI Reporting",
  "/admin/powerbi": "Power BI",
  "/admin/config": "Platform Configuration",
  "/admin/settings": "System Settings",
  "/admin/profile": "Profile",
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = pageRoutes[location.pathname] || "Admin Dashboard";

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={pageTitle}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
