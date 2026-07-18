import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarMenuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: "dashboard",
    color: "bg-blue-500",
  },
  {
    id: "users",
    label: "User Management",
    path: "/admin/users",
    icon: "users",
    color: "bg-purple-500",
  },
  {
    id: "transactions",
    label: "Transactions",
    path: "/admin/transactions",
    icon: "transactions",
    color: "bg-green-500",
  },
  // Energy Pool entry removed
  {
    id: "verification",
    label: "Verifications",
    path: "/admin/verification",
    icon: "verification",
    color: "bg-pink-500",
  },
  {
    id: "reports",
    label: "Reports & Analytics",
    path: "/admin/reports",
    icon: "reports",
    color: "bg-indigo-500",
  },
  {
    id: "config",
    label: "Platform Config",
    path: "/admin/config",
    icon: "config",
    color: "bg-cyan-500",
  },
  {
    id: "settings",
    label: "System Settings",
    path: "/admin/settings",
    icon: "settings",
    color: "bg-pink-500",
  },
];

const IconComponent = ({ icon, color }: { icon: string; color: string }) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    dashboard: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 13h2v8H3zm4-8h2v16H7zM21 4h-7v2h5v14H9V9H7v11c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" />
      </svg>
    ),
    users: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
    transactions: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6 17h12v2H6zm8-9V7h-2v1H8v2h4v2h-4v1h2v1h2V8h4V6h-4z" />
      </svg>
    ),
    energy: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15 1H9v2h6V1zm2.56 6.07l-1.41-1.41-4.24 4.24-1.41-1.41L11.99 2 5 9h8v8l6.56-8.93zM19 17v-5h-2v5h2z" />
      </svg>
    ),
    verification: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
      </svg>
    ),
    reports: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2V17zm4 0h-2V7h2V17zm4 0h-2v-4h2V17z" />
      </svg>
    ),
    config: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.64l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.09-.47 0-.59.22L2.74 8.87c-.12.22-.07.5.12.64l2.03 1.58c-.05.3-.07.62-.07.94 0 .33.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.64l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.5-.12-.64l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
      </svg>
    ),
    settings: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.64l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.09-.47 0-.59.22L2.74 8.87c-.12.22-.07.5.12.64l2.03 1.58c-.05.3-.07.62-.07.94 0 .33.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.64l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.5-.12-.64l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
      </svg>
    ),
  };

  return (
    <div
      className={cn(
        color,
        "w-12 h-12 rounded-lg flex items-center justify-center text-white",
      )}
    >
      {iconMap[icon] || iconMap.dashboard}
    </div>
  );
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(isOpen);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(false);
      onClose?.();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => {
            setMobileOpen(false);
            onClose?.();
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative left-0 top-0 h-screen w-80 bg-sidebar-background border-r border-sidebar-border transition-transform duration-300 ease-in-out z-50",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">POWERFLOW</h1>
                  <p className="text-xs text-red-400">ADMIN</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onClose?.();
                }}
                className="md:hidden text-sidebar-foreground hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-xs text-sidebar-foreground mt-3 ml-13">
              Control Panel
            </p>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {sidebarMenuItems.filter((it:any)=>it && it.id).map((item) => (
              <Link
                key={item.id}
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive(item.path)
                    ? "bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 text-white"
                    : "text-sidebar-foreground hover:text-white hover:bg-white/5",
                )}
              >
                <IconComponent icon={item.icon} color={item.color} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="px-4 py-3 bg-white/5 rounded-lg text-center">
              <p className="text-xs text-sidebar-foreground">
                Control Panel v1.0
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
