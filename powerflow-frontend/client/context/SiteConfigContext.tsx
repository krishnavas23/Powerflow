import { createContext, useContext, useEffect, useMemo, useState } from "react";

type SiteConfig = {
  availableEnergyGWh: number;
  activeHomes: number;
  poolLiquidityCr: number;
};

interface Ctx extends SiteConfig {
  update: (p: Partial<SiteConfig>) => void;
}

const DEFAULTS: SiteConfig = {
  availableEnergyGWh: 2.4,
  activeHomes: 12481,
  poolLiquidityCr: 8.2,
};

const KEY = "powerflow.site.config";
const C = createContext<Ctx | null>(null);

export function SiteConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cfg, setCfg] = useState<SiteConfig>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setCfg({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(cfg));
    } catch {}
  }, [cfg]);

  const value = useMemo<Ctx>(
    () => ({ ...cfg, update: (p) => setCfg((c) => ({ ...c, ...p })) }),
    [cfg],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useSiteConfig() {
  const ctx = useContext(C);
  if (!ctx)
    throw new Error("useSiteConfig must be used within SiteConfigProvider");
  return ctx;
}
