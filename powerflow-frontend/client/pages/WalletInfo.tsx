import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { BACKEND_BASE_URL } from "@shared/api";

export default function WalletInfo() {
  const [inr, setInr] = useState(0);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      // Prefer user profile for canonical wallet/credits
      const prof = await fetch(`${BACKEND_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const profJson = await prof.json();
      if (prof.ok && profJson?.user) {
        setInr(profJson.user.walletBalance || 0);
        setCredits(profJson.user.energyCredits || 0);
      } else {
        // Fallback to wallet balance endpoint
        const res = await fetch(`${BACKEND_BASE_URL}/api/wallet/balance`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load balances");
        setInr(data.walletBalance || 0);
        setCredits(data.energyCredits || 0);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchBalance();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWithdraw = async () => {
    const raw = window.prompt("Withdraw amount (₹)", "500");
    const amount = parseFloat(raw || "0");
    if (!amount || amount <= 0) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BACKEND_BASE_URL}/api/wallet/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Withdraw failed");
      await fetchBalance();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BACKEND_BASE_URL}/api/wallet/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Redeem failed");
      await fetchBalance();
      alert(data.message);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Page>
      <h1 className="text-3xl font-bold">Wallets</h1>
      {error && (
        <div className="mt-3 text-sm text-red-700 bg-red-100 border border-red-300 p-3 rounded-lg">
          {error}
        </div>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur">
          <div className="text-sm text-muted-foreground">INR Wallet</div>
          <div className="mt-2 text-3xl font-bold text-primary">
            ₹{(inr || 0).toLocaleString()}
          </div>
          <Button className="mt-3" variant="secondary" disabled={loading} onClick={handleWithdraw}>Withdraw</Button>
        </div>
        <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur">
          <div className="text-sm text-muted-foreground">Energy Credits</div>
          <div className="mt-2 text-3xl font-bold text-primary">
            {(credits || 0).toLocaleString()} EC
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={handleRedeem} disabled={loading}>Redeem</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Redeem rule: min 100 EC per redemption, ₹4.5 per EC (₹450)
          </p>
        </div>
      </div>
    </Page>
  );
}
