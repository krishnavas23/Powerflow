import { useState, useEffect } from "react";
import { BACKEND_BASE_URL } from "@shared/api";
import React from "react";

// --- MOCK/PLACEHOLDER DEFINITIONS for compilation stability ---
interface WalletContextType {
  inr: number;
  userId: string;
}

const Page = (props: { children: React.ReactNode }) => (
  <div className="p-4 flex justify-center min-h-screen">
    {props.children}
  </div>
);

const Button = (props: any) => (
  <button
    {...props}
    className={
      "w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition duration-150 shadow " +
      props.className
    }
  >
    {props.children}
  </button>
);

const Input = (props: any) => (
  <input
    {...props}
    className={
      "border border-gray-300 p-3 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500 text-black " +
      props.className
    }
  />
);

const useWallet = (): WalletContextType => ({
  inr: 4500.5,
  userId: "mock-user-123",
});
// -----------------------------------------------------------------

// Publishable key only (safe for browser). Secret keys stay on the backend.
const STRIPE_PUBLISHABLE_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  import.meta.env.REACT_STRIPE_PUBLISHABLE_KEY ||
  "";

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn("VITE_STRIPE_PUBLISHABLE_KEY is not set in .env");
}
// --- Custom Hook to Load Stripe.js ---
const useStripeScript = () => {
  useEffect(() => {
    // If Stripe is already loaded, exit
    if (typeof (window as any).Stripe !== "undefined") return;

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);
};

export default function AddFunds() {
  useStripeScript(); // Load Stripe script on mount

  const [amount, setAmount] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // userId is now derived from JWT on backend; no need to send from frontend

  const handleRecharge = async () => {
    if (amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Request Checkout Session from Backend
      const response = await fetch(`${BACKEND_BASE_URL}/api/stripe/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Pass auth token
        },
        body: JSON.stringify({ amount, currency: "inr" }),
      });

      const contentType = response.headers.get("content-type");
      let data: any = {};

      if (response.ok && contentType?.includes("application/json")) {
        data = await response.json();
      } else if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Backend failed with status ${response.status}`);
      }

      // Backend (current) returns a hosted Checkout URL
      if (data.url) {
        window.location.href = data.url;
        return; // Redirecting
      }

      // Fallback: if backend returns a session id instead of a url
      const sessionId = data.sessionId || data.id;
      if (sessionId) {
        if (typeof (window as any).Stripe === "undefined" || !STRIPE_PUBLISHABLE_KEY) {
          throw new Error("Stripe.js library not loaded or Publishable Key is missing.");
        }
        const stripe = (window as any).Stripe(STRIPE_PUBLISHABLE_KEY);
        const result = await stripe.redirectToCheckout({ sessionId });
        if (result.error) throw new Error(result.error.message);
        return;
      }

      throw new Error(data.message || "Failed to initiate payment. Session URL/ID missing.");

      // Note: Loading state is cleared by Stripe redirection; it won't be hit unless an error occurs before redirect.
    } catch (e: any) {
      console.error("Payment initiation error:", e);
      setError(e.message || "An unexpected error occurred during checkout.");
      setLoading(false);
    }
  };

  return (
    <Page>
      <div className="max-w-4xl w-full grid gap-8 p-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur">
          <h1 className="text-3xl font-bold">Add Funds</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Top up your INR wallet via Card or Bank Transfer (Stripe Checkout).
          </p>
          <div className="mt-6 grid gap-4">
            <label className="text-xs text-muted-foreground font-medium">Amount (₹)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAmount(parseInt(e.target.value || "0", 10))
              }
              disabled={loading}
              min="1"
            />
            {/* UPI input removed */}

            <Button onClick={handleRecharge} disabled={loading || amount <= 0} className="mt-2">
              {loading ? "Processing Secure Checkout..." : "Pay via Card / Bank"}
            </Button>

            {error && (
              <div className="text-sm text-red-700 p-3 rounded-xl bg-red-100 border border-red-300">
                Error: {error}
              </div>
            )}
          </div>
        </div>
        <Summary />
      </div>
    </Page>
  );
}

function Summary() {
  const [balance, setBalance] = useState<number>(0);
  useEffect(() => {
    const load = async () => {
      try {
        // Prefer profile for canonical balance
        const prof = await fetch(`${BACKEND_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          cache: 'no-store',
        });
        const p = await prof.json();
        if (prof.ok && p?.user) {
          setBalance(p.user.walletBalance || 0);
          console.debug('Wallet (profile) for user:', p.user.id || p.user._id, 'balance:', p.user.walletBalance);
        } else {
          const res = await fetch(`${BACKEND_BASE_URL}/api/wallet/balance`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            cache: 'no-store',
          });
          const data = await res.json();
          if (res.ok) setBalance(data.walletBalance || 0);
        }
      } catch {}
    };

    // initial fetch
    load();

    // refetch when tab becomes visible (e.g., after Stripe redirect back)
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return (
    <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur">
      <div className="text-sm text-muted-foreground font-semibold">Current Wallet Balance</div>
      <div className="mt-2 text-4xl font-extrabold text-primary">
        ₹{(balance || 0).toLocaleString("en-IN")}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Funds added are instantly credited upon successful payment confirmation from Stripe's
        webhook.
      </p>
      <ul className="mt-4 text-xs text-muted-foreground space-y-1">
        <li>- Minimum recharge: ₹1.00</li>
        <li>- Secured by Stripe</li>
      </ul>
    </div>
  );
}
