import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Page } from "@/components/Page";
import { useAuth } from "@/context/AuthContext";
import { Select } from "@/components/ui/select";
import { BACKEND_BASE_URL } from "@shared/api";

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || "http://localhost:8081";

function Rings() {
  const rings = useMemo(() => Array.from({ length: 10 }), []);
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {rings.map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30"
          initial={{ scale: 0.6 + i * 0.08, opacity: 0 }}
          animate={{ scale: 0.6 + i * 0.08, opacity: [0.1, 0.35, 0.1] }}
          transition={{
            duration: 2 + i * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    meterId: "",
  });
  const [roleChoice, setRoleChoice] = useState<'Producer' | 'Buyer' | 'Admin'>('Buyer');
  const [accountType, setAccountType] = useState<'Individual' | 'Company' | 'NGO' | 'Hospital' | 'Producer'>('Individual');
  const [adminKey, setAdminKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const from = search.get("from") || "/";
  const { loginUser } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ Determine endpoint
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";

      // ✅ Payload aligned with backend requirements
      // Admin key is typed by the user and only validated on the server — never hardcode it here.
      const isAdminSelected = roleChoice === 'Admin';
      const payload = isRegister
        ? {
            name: form.name,
            email: form.email,
            password: form.password,
            meterId: form.meterId || (isAdminSelected ? 'ADMIN-METER' : undefined),
            role: isAdminSelected ? 'Admin' : roleChoice,
            accountType: isAdminSelected ? 'Company' : (roleChoice === 'Producer' ? 'Producer' : accountType),
            adminKey: adminKey || undefined,
          }
        : {
            email: form.email,
            password: form.password,
            adminKey: adminKey || undefined,
          };

      const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Authentication failed");

      // ✅ Save JWT token and user role info
      localStorage.setItem("token", data.token);
      if (data.user) {
        localStorage.setItem("powerflow.user", JSON.stringify(data.user));
      }

      // ✅ Admin redirect (based on server-returned role only)
      if (String(data.user?.role || '').toLowerCase() === 'admin') {
        window.location.href = `${ADMIN_URL}/auth`;
        return;
      }

      // ✅ Update in-memory auth state for normal users
      loginUser();

      // ✅ Redirect
      navigate(from);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <div className="relative mx-auto grid max-w-4xl grid-cols-1 items-stretch overflow-hidden rounded-3xl border bg-card/50 backdrop-blur md:grid-cols-2 shadow-2xl">
        <Rings />

        {/* Left side gradient / logo */}
        <motion.div
          className="relative hidden md:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-transparent to-primary/10" />
          <div className="absolute inset-0 grid place-items-center">
            <img
              src="/logos/powerflow.svg"
              alt="POWERFLOW"
              className="h-16 animate-float"
            />
          </div>
        </motion.div>

        {/* Right side form */}
        <div className="relative p-8">
          <h1 className="text-2xl font-bold">
            {isRegister ? "Create your Account" : "Welcome to POWERFLOW"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRegister ? "Fill in your details to register." : "Sign in to continue."}
          </p>

          <div className="mt-6 space-y-4">
            {/* 👤 Registration fields */}
            {isRegister && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">
                    Full Name
                  </label>
                  <Input
                    name="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">I am</label>
                  <select
                    className="w-full border rounded h-9 bg-background"
                    value={roleChoice}
                    onChange={(e) => setRoleChoice(e.target.value as any)}
                  >
                    <option value="Buyer">Consumer</option>
                    <option value="Producer">Producer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                {roleChoice === 'Buyer' && (
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Consumer type</label>
                    <select
                      className="w-full border rounded h-9 bg-background"
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as any)}
                    >
                      <option value="Individual">Individual</option>
                      <option value="Company">Industry</option>
                      <option value="NGO">NGO</option>
                      <option value="Hospital">Hospital</option>
                    </select>
                  </div>
                )}
              </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">
                    Meter ID
                  </label>
                  <Input
                    name="meterId"
                    placeholder="Enter your meter ID"
                    value={form.meterId}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* 📧 Email + Password fields (for user login or register) */}
            <> {/* FIXED: Removed extraneous ( and ) around this block */}
              <div>
                <label className="text-xs text-muted-foreground font-medium">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-primary"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </>

            {/* 🔑 Admin key (optional) */}
            <div>
              <label className="text-xs text-muted-foreground font-medium">Admin Key (optional)</label>
              <div className="relative">
                <Input
                  type={showAdminKey ? 'text' : 'password'}
                  placeholder="Enter special admin key"
                  value={adminKey}
                  onChange={(e)=>setAdminKey(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminKey((s)=>!s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-primary"
                >
                  {showAdminKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">Use only if you are an administrator.</div>
            </div>

            {/* ⚠️ Error */}
            {error && (
              <div className="text-sm text-red-700 bg-red-100 border border-red-300 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* ✅ Submit Button */}
            <Button
              className="w-full mt-2"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : isRegister
                ? "Register"
                : "Login"}
            </Button>

            {/* 🔄 Toggle modes */}
            <div className="text-xs text-center text-muted-foreground mt-4 space-y-1">
              <p>
                {isRegister
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}
                <button
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-primary font-medium hover:underline"
                >
                  {isRegister ? "Login" : "Register"}
                </button>
              </p>
              <p>
                {/* <Link to="/forgot-password" className="text-primary font-medium hover:underline">
                  Forgot password?
                </Link> */}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );

}