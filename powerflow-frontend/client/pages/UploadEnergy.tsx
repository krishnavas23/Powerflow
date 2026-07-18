import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { BACKEND_BASE_URL } from "@shared/api";
import { useListings } from "@/context/ListingsContext";

export default function UploadEnergy() {
  const { refreshListings } = useListings();
  const [form, setForm] = useState({
    kwh: 10,
    priceMin: 5.5,
    priceMax: 8.5,
    demandPrice: 6.5,
    source: "Solar Rooftop",
    location: "Bengaluru",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  // We rely on backend auth for role enforcement to avoid stale local state

  return (
    <Page>
      <h1 className="text-3xl font-bold">Upload Surplus Energy</h1>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="grid gap-3">
          <label className="text-xs text-muted-foreground">
            Available kWh to upload
          </label>
          <Input
            type="number"
            value={form.kwh}
            onChange={(e) =>
              setForm((f) => ({ ...f, kwh: parseFloat(e.target.value || "0") }))
            }
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">
                Min price ₹/kWh
              </label>
              <Input
                type="number"
                step="0.1"
                value={form.priceMin}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    priceMin: parseFloat(e.target.value || "0"),
                  }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Max price ₹/kWh
              </label>
              <Input
                type="number"
                step="0.1"
                value={form.priceMax}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    priceMax: parseFloat(e.target.value || "0"),
                  }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Demand price ₹/kWh
              </label>
              <Input
                type="number"
                step="0.1"
                value={form.demandPrice}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    demandPrice: parseFloat(e.target.value || "0"),
                  }))
                }
              />
            </div>
          </div>
          <label className="text-xs text-muted-foreground">Source</label>
          <Input
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
          />
          <label className="text-xs text-muted-foreground">Location</label>
          <Input
            value={form.location}
            onChange={(e) =>
              setForm((f) => ({ ...f, location: e.target.value }))
            }
          />
          {error && (
            <div className="text-sm text-red-700 bg-red-100 border border-red-300 p-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-700 bg-green-100 border border-green-300 p-3 rounded-lg">
              {success}
              {form.kwh && (
                <div className="mt-2">
                  <a
                    className="underline"
                    href={`${BACKEND_BASE_URL}/api/energy/receipt/${(lastCreatedId as any) || ''}.pdf`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download Listing Receipt (PDF)
                  </a>
                </div>
              )}
            </div>
          )}
          <Button
            disabled={loading}
            onClick={async () => {
              try {
                setLoading(true);
                setError(null);
                setSuccess(null);
                // Backend expects kwhAvailable, minPrice, maxPrice, demandPrice, source, location
                const res = await fetch(`${BACKEND_BASE_URL}/api/energy/upload`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                  body: JSON.stringify({
                    kwhAvailable: form.kwh,
                    minPrice: form.priceMin,
                    maxPrice: form.priceMax,
                    demandPrice: form.demandPrice,
                    source: form.source,
                    location: form.location,
                  }),
                });
                const data = await res.json();
                if (!res.ok) {
                  if (res.status === 403) {
                    throw new Error(data.message || 'Only Producers can upload energy.');
                  }
                  throw new Error(data.message || `Failed to upload energy (HTTP ${res.status})`);
                }
                setSuccess(data.message || "Energy listing created successfully.");
                // expose the new listing id for receipt link
                setLastCreatedId(data.listing?._id);
                // Sync latest listings into BuyEnergy
                await refreshListings();
              } catch (e: any) {
                setError(e.message);
              } finally {
                setLoading(false);
              }
            }}
          >
            List Energy
          </Button>
          <p className="text-xs text-muted-foreground">
            Upload adds energy to the central pool and credits your wallet 1:1 EC.
          </p>
        </div>
        <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur">
          <div className="text-sm text-muted-foreground">Tips</div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Set demand price within your min-max range.</li>
            <li>Accurate source and location improves trust.</li>
            <li>Increase demand price when pool demand rises.</li>
          </ul>
        </div>
      </div>
    </Page>
  );
}
