import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListings } from "@/context/ListingsContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { BACKEND_BASE_URL } from "@shared/api";
import { AlertCircle, CheckCircle } from "lucide-react";

interface BuyingLimit {
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
  totalEnergyPool: number;
  totalUsers: number;
}

export default function BuyEnergy() {
  const { listings, purchase } = useListings();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [buyingLimit, setBuyingLimit] = useState<BuyingLimit | null>(null);
  const [loadingLimit, setLoadingLimit] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadLimit = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/energy/buying-limit`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBuyingLimit(data.limit);
        }
      } catch (e) {
        console.error('Failed to load buying limit:', e);
      } finally {
        setLoadingLimit(false);
      }
    };
    loadLimit();
  }, []);

  const refreshLimit = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/energy/buying-limit`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBuyingLimit(data.limit);
      }
    } catch (e) {
      console.error('Failed to refresh limit:', e);
    }
  };

  return (
    <Page>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Buy Energy</h1>
        {buyingLimit && (
          <div className="rounded-lg border bg-card/60 p-3 backdrop-blur">
            <div className="flex items-center gap-2 text-sm">
              {buyingLimit.remainingToday > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <div>
                <span className="text-muted-foreground">Daily Limit: </span>
                <span className="font-semibold">{buyingLimit.remainingToday.toFixed(2)} / {buyingLimit.dailyLimit.toFixed(2)} kWh</span>
                <span className="text-xs text-muted-foreground ml-2">({buyingLimit.usedToday.toFixed(2)} used today)</span>
              </div>
            </div>
          </div>
        )}
      </div>
      {buyingLimit && buyingLimit.remainingToday <= 0 && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          You have reached your daily buying limit. Please try again tomorrow.
        </div>
      )}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {listings.length === 0 && (
          <div className="rounded-xl border bg-card/60 p-6 text-muted-foreground">
            No listings yet. Upload energy to see offers.
          </div>
        )}
        {listings.filter((x)=> (x.kwhAvailable ?? 0) > 0).map((l) => (
          <div
            key={l.id}
            className="rounded-2xl border bg-card/60 p-5 backdrop-blur"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">{l.source}</div>
                <div className="text-xs text-muted-foreground">
                  {l.location}
                </div>
              </div>
              <div className="text-primary font-semibold">
                ₹{l.demandPrice}/kWh
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Available: {l.kwhAvailable} kWh • Range: ₹{l.priceMin}-{l.priceMax}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Input
                type="number"
                className="w-28"
                placeholder="kWh"
                min={0}
                max={buyingLimit ? buyingLimit.remainingToday : undefined}
                value={qty[l.id] ?? 1}
                onChange={(e) => {
                  const val = parseFloat(e.target.value || "0");
                  setQty((q) => ({
                    ...q,
                    [l.id]: Math.max(0, val),
                  }));
                }}
              />
              {buyingLimit && (qty[l.id] ?? 1) > buyingLimit.remainingToday && (
                <span className="text-xs text-red-400">
                  Max: {buyingLimit.remainingToday.toFixed(2)} kWh
                </span>
              )}
              <Button
                disabled={
                  (l.kwhAvailable ?? 0) <= 0 ||
                  (buyingLimit && (qty[l.id] ?? 1) > buyingLimit.remainingToday)
                }
                onClick={async () => {
                  const q = Math.max(0, qty[l.id] ?? 1);
                  if (q <= 0) return;
                  
                  // Check if purchase exceeds remaining limit
                  if (buyingLimit && q > buyingLimit.remainingToday) {
                    toast({
                      title: 'Limit exceeded',
                      description: `You can only buy ${buyingLimit.remainingToday.toFixed(2)} kWh more today.`,
                      variant: 'destructive'
                    });
                    return;
                  }

                  const result = await purchase(l.id, q);
                  if (!result.ok) {
                    toast({ title: 'Purchase failed', description: result.message, variant: 'destructive' });
                    // Refresh limit in case it was updated
                    await refreshLimit();
                  } else {
                    toast({ title: 'Purchase successful', description: `Bought ${q} kWh. INR deducted from wallet.` });
                    // Refresh limit after successful purchase
                    await refreshLimit();
                    if (result.txId) {
                      // Open printable receipt in new tab
                      window.open(`${import.meta.env?.VITE_BACKEND_BASE_URL || (window as any).__POWERFLOW_API__ || 'http://localhost:4000'}/api/payments/receipt/transaction/${result.txId}.pdf`, '_blank');
                    }
                  }
                }}
              >
                { (l.kwhAvailable ?? 0) <= 0 ? 'Sold out' : 
                  (buyingLimit && (qty[l.id] ?? 1) > buyingLimit.remainingToday) ? 'Limit exceeded' : 'Buy' }
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
