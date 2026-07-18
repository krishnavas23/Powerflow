import { Menu, Bell, LogOut, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export default function Header({
  title = "Dashboard",
  onMenuClick,
}: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { logout } = useAuth();

  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden text-foreground hover:text-primary transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* removed standalone settings icon */}

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-bold">
              A
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:inline">
              Admin
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
              <a href="/admin/profile" className="w-full px-4 py-2 text-left text-foreground hover:bg-white/5 flex items-center gap-2 transition-colors block">
                <User className="w-4 h-4" />
                Profile
              </a>
              <hr className="border-border my-2" />
              <button
                onClick={logout}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
