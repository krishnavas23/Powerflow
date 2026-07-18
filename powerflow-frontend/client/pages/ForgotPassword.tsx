import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Page } from "@/components/Page";
import { useAuth } from "@/context/AuthContext";

import { BACKEND_BASE_URL } from "@shared/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${BACKEND_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to send reset link");

      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <div className="relative mx-auto grid max-w-lg items-stretch overflow-hidden rounded-3xl border bg-card/50 backdrop-blur md:grid-cols-1 shadow-2xl">
        <div className="relative p-8">
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-100 border border-red-300 p-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-700 bg-green-100 border border-green-300 p-3 rounded-lg">
                {success}
              </div>
            )}

            <Button
              className="w-full mt-2"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </div>
        </div>
      </div>
    </Page>
  );
}
