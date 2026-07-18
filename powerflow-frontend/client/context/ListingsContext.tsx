import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BACKEND_BASE_URL } from "@shared/api";

export type Listing = {
  id: string;
  kwhAvailable: number;
  priceMin: number;
  priceMax: number;
  demandPrice: number;
  source: string;
  location: string;
  createdAt: number;
};

interface Ctx {
  listings: Listing[];
  addListing: (l: Omit<Listing, "id" | "createdAt">) => void;
  buyFromListing: (id: string, kwh: number) => Listing | null;
  purchase: (id: string, kwh: number) => Promise<{ ok: boolean; message?: string; txId?: string }>;
  refreshListings: () => Promise<void>;
  totalAvailable: number;
}

const KEY = "powerflow.listings";
const C = createContext<Ctx | null>(null);

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadedFromBackend, setLoadedFromBackend] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setListings(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(listings));
    } catch {}
  }, [listings]);

  const addListing: Ctx["addListing"] = (l) => {
    const item: Listing = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      ...l,
    };
    setListings((arr) => [item, ...arr]);
  };

  const refreshListings: Ctx["refreshListings"] = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/energy/listings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch listings");
      const src = Array.isArray(data.listings) ? data.listings : Array.isArray(data) ? data : [];
      const mapped: Listing[] = src.map((it: any) => ({
        id: it._id,
        kwhAvailable: it.kwhAvailable ?? it.kwh ?? it.availableKwh ?? 0,
        priceMin: it.minPrice ?? it.priceMin ?? it.pricePerKwh ?? it.demandPrice ?? 0,
        priceMax: it.maxPrice ?? it.priceMax ?? it.pricePerKwh ?? it.demandPrice ?? 0,
        demandPrice: it.demandPrice ?? it.pricePerKwh ?? it.minPrice ?? 0,
        source: it.source || "Unknown",
        location: it.location || "",
        createdAt: new Date(it.createdAt || Date.now()).getTime(),
      }));
      // Ensure sold-out listings are not displayed
      setListings(mapped.filter((l) => l.kwhAvailable > 0));
      setLoadedFromBackend(true);
    } catch (e) {
      // leave local listings in place on error
    }
  };

  const purchase: Ctx["purchase"] = async (id, kwh) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/energy/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ listingId: id, quantity: kwh })
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, message: data.message || 'Failed to buy energy' };
      }
      await refreshListings();
      return { ok: true, txId: data.transactionId };
    } catch (e: any) {
      return { ok: false, message: e.message };
    }
  };

  useEffect(() => {
    // Load from backend on first mount to ensure server truth
    refreshListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const buyFromListing: Ctx["buyFromListing"] = (id, kwh) => {
    let bought: Listing | null = null;
    setListings((arr) => {
      const nextArr = arr.map((it) => {
        if (it.id === id) {
          const qty = Math.min(kwh, it.kwhAvailable);
          const next = {
            ...it,
            kwhAvailable: Math.max(0, it.kwhAvailable - qty),
          };
          bought = next;
          return next;
        }
        return it;
      });
      // Drop sold-out listing locally for instant UI feedback
      return nextArr.filter((l) => l.kwhAvailable > 0);
    });
    return bought;
  };
  const totalAvailable = useMemo(
    () => listings.reduce((s, l) => s + l.kwhAvailable, 0),
    [listings],
  );

  const value = useMemo(
    () => ({ listings, addListing, buyFromListing, purchase, refreshListings, totalAvailable }),
    [listings],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useListings() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useListings must be used within ListingsProvider");
  return ctx;
}
