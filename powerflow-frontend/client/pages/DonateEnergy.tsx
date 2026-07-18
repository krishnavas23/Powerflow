import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/context/WalletContext";
import { useDonations } from "@/context/DonationsContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@shared/api";

export default function DonateEnergy() {
  const wallet = useWallet();
  const { ngos, donate, donations, stats, refresh } = useDonations();
  const [to, setTo] = useState(ngos[0]?.name || "");
  const [credits, setCredits] = useState(5);
  const [receiverId, setReceiverId] = useState(ngos[0]?.id || "");
  const { toast } = useToast();

  return (
    <Page>
      <h1 className="text-3xl font-bold">Donate Energy</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">Browse NGOs & Hospitals</h2>
          <ul className="mt-3 grid gap-2">
            {ngos.map((n) => (
              <li
                key={n.id}
                className="rounded-lg border bg-background/60 p-3 text-sm"
              >
                {n.name}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-2">
            <label className="text-xs text-muted-foreground">
              Choose beneficiary
            </label>
            <select
              className="h-10 rounded-md border bg-background px-3"
              value={receiverId}
              onChange={(e) => {
                const selId = e.target.value;
                setReceiverId(selId);
                const match = ngos.find((x) => x.id === selId);
                setTo(match?.name || "");
              }}
            >
              {ngos.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
            <label className="text-xs text-muted-foreground">
              Amount (credits)
            </label>
            <Input
              type="number"
              value={credits}
              onChange={(e) => setCredits(parseInt(e.target.value || "0", 10))}
            />
            {/* Receiver ID now comes from the selected NGO/service */}
            <Button
              onClick={async () => {
                try {
                  if (!receiverId) {
                    toast({ title: 'Receiver required', description: 'Please enter a valid recipient user ID.', variant: 'destructive' });
                    return;
                  }
                  const result = await donate(to, credits);
                  if (!result.ok) throw new Error(result.message || 'Failed to donate');
                  // Optimistically decrement wallet energy credits in UI
                  wallet.donateCredits(credits, `Donated to ${to}`);
                  await refresh();
                  toast({ title: 'Donation successful', description: `${credits} EC donated. A confirmation email has been sent.` });
                  // Open receipt in new tab if donation ID available
                  if (result.donationId) {
                    setTimeout(() => {
                      window.open(`${BACKEND_BASE_URL}/api/energy/receipt/donation/${result.donationId}.pdf`, '_blank');
                    }, 500);
                  }
                } catch (e: any) {
                  toast({ title: 'Donation failed', description: e.message, variant: 'destructive' });
                }
              }}
            >
              Donate
            </Button>
            <p className="text-xs text-muted-foreground">Your available credits are managed by your backend wallet. Ensure you are logged in.</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">My Donations</h2>
          <ul className="mt-3 grid gap-2 max-h-72 overflow-auto pr-1">
            {donations.length === 0 && (
              <li className="text-sm text-muted-foreground">
                No donations yet.
              </li>
            )}
            {donations.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-lg border bg-background/60 p-3 text-sm"
              >
                <span>{d.to}</span>
                <span className="text-primary font-semibold">
                  {d.credits} EC
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">Impact</h2>
          <div className="mt-2 grid gap-2 text-sm">
            <Row k="Total donated" v={`${stats.totalDonated} EC`} />
            <Row k="People helped" v={`${stats.peopleHelped}`} />
            <Row k="Impact rank" v={`#${stats.impactRank}`} />
            <Row k="Goals met" v={`${stats.goalsMet}/10`} />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Impact stories: Local clinic powered during outages, school labs lit
            for evening classes, emergency ward stabilized with renewable
            backup.
          </div>
        </div>
      </div>
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
