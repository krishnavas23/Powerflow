import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Transaction = {
  id: string;
  type: "add_funds" | "buy" | "upload" | "donate" | "redeem";
  inr?: number;
  credits?: number;
  note?: string;
  at: number;
};

type WalletState = {
  inr: number;
  credits: number;
  transactions: Transaction[];
};
interface WalletCtx extends WalletState {
  addFunds: (amount: number) => void;
  buyEnergy: (kwh: number, pricePerKwh: number, note?: string) => boolean;
  uploadEnergy: (kwh: number, note?: string) => void;
  donateCredits: (credits: number, note?: string) => boolean;
  redeemCredits: (min: number, rate: number) => number;
  spendINR: (amount: number, note?: string) => boolean;
  addCredits: (amount: number, note?: string) => void;
}

function getCurrentUserId(): string | null {
  try {
    const rawUser = localStorage.getItem('powerflow.user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      return u?.id || u?._id || null;
    }
  } catch {}
  return null;
}

const DEFAULT: WalletState = { inr: 0, credits: 0, transactions: [] };
const C = createContext<WalletCtx | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>(DEFAULT);
  const storageKey = useMemo(() => {
    const uid = getCurrentUserId();
    return uid ? `powerflow.wallet.${uid}` : 'powerflow.wallet';
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {}
  }, [storageKey]);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
  }, [state, storageKey]);

  const log = (t: Transaction) =>
    setState((s) => ({
      ...s,
      transactions: [t, ...s.transactions].slice(0, 100),
    }));

  const value = useMemo<WalletCtx>(
    () => ({
      ...state,
      addFunds: (amount) => {
        const v = Math.max(0, amount);
        setState((s) => ({ ...s, inr: s.inr + v }));
        log({
          id: crypto.randomUUID(),
          type: "add_funds",
          inr: v,
          at: Date.now(),
          note: "UPI",
        });
      },
      buyEnergy: (kwh, price, note) => {
        const cost = Math.max(0, kwh) * Math.max(0, price);
        if (state.inr >= cost) {
          setState((s) => ({
            ...s,
            inr: s.inr - cost,
            credits: s.credits + kwh,
          }));
          log({
            id: crypto.randomUUID(),
            type: "buy",
            inr: -cost,
            credits: kwh,
            at: Date.now(),
            note,
          });
          return true;
        }
        return false;
      },
      uploadEnergy: (kwh, note) => {
        const v = Math.max(0, kwh);
        setState((s) => ({ ...s, credits: s.credits + v }));
        log({
          id: crypto.randomUUID(),
          type: "upload",
          credits: v,
          at: Date.now(),
          note,
        });
      },
      donateCredits: (c, note) => {
        const v = Math.max(0, c);
        if (state.credits >= v) {
          setState((s) => ({ ...s, credits: s.credits - v }));
          log({
            id: crypto.randomUUID(),
            type: "donate",
            credits: -v,
            at: Date.now(),
            note,
          });
          return true;
        }
        return false;
      },
      redeemCredits: (min, rate) => {
        if (state.credits < min) return 0;
        const redeemable = state.credits - (state.credits % min);
        const rupees = redeemable * rate;
        setState((s) => ({
          inr: s.inr + rupees,
          credits: s.credits - redeemable,
        }));
        log({
          id: crypto.randomUUID(),
          type: "redeem",
          inr: rupees,
          credits: -redeemable,
          at: Date.now(),
          note: `₹${rate}/EC`,
        });
        return rupees;
      },
      spendINR: (amount, note) => {
        const v = Math.max(0, amount);
        if (state.inr >= v) {
          setState((s) => ({ ...s, inr: s.inr - v }));
          log({
            id: crypto.randomUUID(),
            type: "buy",
            inr: -v,
            at: Date.now(),
            note,
          });
          return true;
        }
        return false;
      },
      addCredits: (amount, note) => {
        const v = Math.max(0, amount);
        setState((s) => ({ ...s, credits: s.credits + v }));
        log({
          id: crypto.randomUUID(),
          type: "upload",
          credits: v,
          at: Date.now(),
          note,
        });
      },
    }),
    [state],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useWallet() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
