import { Link, NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/add-funds", label: "Add Funds" },
  { to: "/wallet", label: "Wallet Info" },
  { to: "/upload", label: "Upload Energy" },
  { to: "/forecast", label: "AI Forecast" },
  { to: "/buy", label: "Buy Energy" },
  { to: "/donate", label: "Donate Energy" },
  { to: "/profile", label: "Profile" },
  { to: "/help", label: "Help" },
];

export default function NavBar() {
  const { role, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logos/powerflow.svg"
            alt="POWERFLOW"
            className="h-8 w-auto"
          />
        </Link>
        <nav className="hidden md:flex items-center gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <Button asChild variant="secondary">
              <Link to={`/auth?from=${encodeURIComponent(location.pathname)}`}>
                Sign in
              </Link>
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {role.toUpperCase()}
              </span>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
