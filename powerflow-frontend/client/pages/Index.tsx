import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { useWallet } from "@/context/WalletContext";
import { useListings } from "@/context/ListingsContext";
import { useEffect, useState } from "react";
import { BACKEND_BASE_URL } from "@shared/api";

export default function Index() {
  const site = useSiteConfig();
  const wallet = useWallet();
  const { totalAvailable } = useListings();
  const [inrBalance, setInrBalance] = useState<number | null>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [energyCredits, setEnergyCredits] = useState<number | null>(null);
  const [poolAvailableKwh, setPoolAvailableKwh] = useState<number | null>(null);
  const [globalAvailableKwh, setGlobalAvailableKwh] = useState<number | null>(null);
  const [globalActiveHomes, setGlobalActiveHomes] = useState<number | null>(null);
  const [globalPoolLiquidityInr, setGlobalPoolLiquidityInr] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(`${BACKEND_BASE_URL}/api/dashboard/overview`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          cache: 'no-store',
        });
        const json = await resp.json();
        if (resp.ok && json?.success && json?.data) {
          const { global, user } = json.data;
          // Global stats
          if (global) {
            setGlobalAvailableKwh(Number(global.availableEnergy) || 0);
            setGlobalActiveHomes(Number(global.activeHomes) || 0);
            setGlobalPoolLiquidityInr(Number(global.poolLiquidity) || 0);
          }
          // User-specific stats
          if (user) {
            setInrBalance(Number(user.walletINR) || 0);
            setEnergyCredits(Number(user.energyCredits) || 0);
            setPoolAvailableKwh(Number(user.listingsEnergy) || 0);
            if (Array.isArray(user.recentTransactions)) {
              setTxns(user.recentTransactions);
            }
          }
        }
      } catch {}
    };
    load();
  }, []);

  return (
    <Page>
      <section className="grid items-start gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          {null}
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl w-fit">
            POWERFLOW
            <span className="block text-lg font-semibold tracking-widest text-primary md:text-2xl text-right">
              UPI FOR POWER
            </span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Interactive energy dashboard where electricity flows between homes
            in shimmering golden wires. Manage INR and energy credits
            seamlessly.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/buy">Buy Energy</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/forecast">AI Forecast</Link>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline">
                  Verify Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Verify your profile</DialogTitle>
                  <DialogDescription>
                    Enter your KYC details to unlock higher limits and access
                    advanced features.
                  </DialogDescription>
                </DialogHeader>
                <form className="grid gap-3">
                  <Input placeholder="Full name" />
                  <Input placeholder="PAN number" />
                  <Input placeholder="Aadhaar (last 4)" />
                  <Button type="submit">Submit for verification</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 text-center">
            <Stat
              k="Available Energy"
              v={
                globalAvailableKwh != null
                  ? `${(globalAvailableKwh / 1_000_000).toFixed(2)} GWh`
                  : `${site.availableEnergyGWh} GWh`
              }
            />
            <Stat
              k="Active Homes"
              v={(globalActiveHomes ?? site.activeHomes).toLocaleString()}
            />
            <Stat
              k="Pool Liquidity"
              v={
                globalPoolLiquidityInr != null
                  ? `₹${(globalPoolLiquidityInr / 10_000_000).toFixed(2)} Cr`
                  : `₹${site.poolLiquidityCr} Cr`
              }
            />
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-primary/10 blur-2xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              title="Add Funds"
              to="/add-funds"
              desc="Top-up INR wallet via UPI/bank"
            />
            <FeatureCard
              title="Wallet Info"
              to="/wallet"
              desc="INR & Energy credits"
            />
            <FeatureCard
              title="Upload Energy"
              to="/upload"
              desc="List surplus energy"
            />
            <FeatureCard
              title="Donate Energy"
              to="/donate"
              desc="Support NGOs & hospitals"
            />
            <FeatureCard
              title="AI Forecast"
              to="/forecast"
              desc="Predict demand & supply"
            />
            <FeatureCard title="Profile" to="/profile" desc="Your details" />
            <FeatureCard title="Help" to="/help" desc="Get support" />
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur lg:col-span-1">
          <h3 className="text-lg font-semibold">Wallet</h3>
          <div className="mt-3 grid gap-2 text-sm">
            <Row k="INR Balance" v={`₹${(inrBalance ?? 0).toLocaleString()}`} />
            <Row k="Energy Credits" v={`${(energyCredits ?? 0).toLocaleString()} EC`} />
            <Row k="Listings Energy Available" v={`${(poolAvailableKwh ?? totalAvailable).toLocaleString()} kWh`} />
          </div>
        </div>
        <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur lg:col-span-2">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <ul className="mt-3 grid gap-2 max-h-64 overflow-auto pr-1 text-sm">
            {txns.length === 0 && (
              <li className="text-muted-foreground">No transactions yet.</li>
            )}
            {txns.map((t: any) => (
              <li
                key={t._id}
                className="flex items-center justify-between rounded-lg border bg-background/60 p-3"
              >
                <span className="capitalize">{t.type?.toLowerCase()}</span>
                <span className="text-muted-foreground">{t.status || ''}</span>
                <span className={`${(t.totalAmount ?? 0) < 0 ? 'text-red-400' : 'text-primary'} font-medium`}>
                  {typeof t.totalAmount === 'number' ? `₹${Math.abs(t.totalAmount).toLocaleString()}` : ''}
                  {typeof t.kwh === 'number' ? ` • ${t.kwh} kWh` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Page>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border bg-card/60 p-4 backdrop-blur transition hover:shadow-[0_0_0_1px_hsl(var(--electric))]">
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="mt-1 text-xl font-semibold text-primary">{v}</div>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  to,
}: {
  title: string;
  desc: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border bg-card/60 p-5 backdrop-blur transition hover:border-primary/40"
    >
      <div
        className="pointer-events-none absolute -inset-1 rounded-2xl opacity-0 blur-2xl transition duration-500 group-hover:opacity-60"
        style={{
          background:
            "radial-gradient(600px 200px at 0% 0%, hsl(var(--electric)/.5), transparent)",
        }}
      />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
        <span className="ml-4 mt-1 text-primary">→</span>
      </div>
    </Link>
  );
}
