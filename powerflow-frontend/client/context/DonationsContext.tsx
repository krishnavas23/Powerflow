import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BACKEND_BASE_URL } from "@shared/api";

type Donation = { id: string; to: string; credits: number; at: number };

interface Ctx {
  ngos: { id: string; name: string }[];
  donate: (to: string, credits: number) => Promise<{ ok: boolean; message?: string; donationId?: string }>;
  refresh: () => Promise<void>;
  donations: Donation[];
  stats: {
    totalDonated: number;
    peopleHelped: number;
    impactRank: number;
    goalsMet: number;
  };
}

const KEY = "powerflow.donations";
const DEFAULT_NGOS: { id: string; name: string }[] = [
  { id: "ngo_aidgrid", name: "AidGrid Foundation" },
  { id: "hosp_healpower", name: "HealPower Hospital" },
  { id: "ngo_lightup", name: "LightUp NGO" },
  { id: "clinic_greenspark", name: "GreenSpark Clinic" },
  { id: "hosp_suncare", name: "SunCare Hospital" },
];
const C = createContext<Ctx | null>(null);

export function DonationsProvider({ children }: { children: React.ReactNode }) {
  const [donations, setDonations] = useState<Donation[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDonations(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(donations));
    } catch {}
  }, [donations]);

  const refresh: Ctx["refresh"] = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/energy/my-donations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load donations');
      const src = Array.isArray(data.donations) ? data.donations : Array.isArray(data) ? data : [];
      const mapped: Donation[] = src.map((it: any) => ({
        id: it._id,
        to: it.beneficiary || it.to || 'Beneficiary',
        credits: it.kwh ?? it.credits ?? 0,
        at: new Date(it.createdAt || Date.now()).getTime(),
      }));
      setDonations(mapped);
    } catch {}
  };

  const donate: Ctx["donate"] = async (to, credits) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/energy/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        body: JSON.stringify({ kwh: credits, beneficiary: to })
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, message: data.message || 'Failed to donate' };
      await refresh();
      return { ok: true, donationId: data.donationId };
    } catch (e: any) {
      return { ok: false, message: e.message };
    }
  };

  const stats = useMemo(() => {
    const totalDonated = donations.reduce((s, d) => s + d.credits, 0);
    const peopleHelped = Math.round(totalDonated * 1.7);
    const goalsMet = Math.min(10, Math.floor(totalDonated / 50));
    const impactRank = Math.max(1, 100 - Math.floor(totalDonated));
    return { totalDonated, peopleHelped, impactRank, goalsMet };
  }, [donations]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <C.Provider value={{ ngos: DEFAULT_NGOS, donate, refresh, donations, stats }}>
      {children}
    </C.Provider>
  );
}

export function useDonations() {
  const ctx = useContext(C);
  if (!ctx)
    throw new Error("useDonations must be used within DonationsProvider");
  return ctx;
}
