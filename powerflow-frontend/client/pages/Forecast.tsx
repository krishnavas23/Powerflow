import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "http://127.0.0.1:8000";
const PROD_URL = `${AI_BASE_URL}/api/predict-simple/`;
const CONS_URL = `${AI_BASE_URL}/api/consumption/`;
const RECO_URL = `${AI_BASE_URL}/api/recommend/`;

export default function Forecast() {
  const [prodForm, setProdForm] = useState({
    city: "Delhi",
    capacity_kw: 5,
    efficiency: 0.8,
    past_avg_kwh: 18,
  });
  const [consForm, setConsForm] = useState({
    num_appliances: 12,
    num_heavy: 3,
    num_light: 9,
    avg_heavy_wattage: 800,
    avg_light_wattage: 30,
    avg_usage_hours: 6,
    day_type: 0,
    prev_day_consumption: 15,
    humidity: 50,
  });

  const [productionKwh, setProductionKwh] = useState<number | null>(null);
  const [consumptionKwh, setConsumptionKwh] = useState<number | null>(null);
  const [loadingProd, setLoadingProd] = useState(false);
  const [loadingCons, setLoadingCons] = useState(false);
  const [loadingReco, setLoadingReco] = useState(false);
  const [reco, setReco] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const chartData = useMemo(() => {
    const prod = productionKwh ?? 0;
    const cons = consumptionKwh ?? 0;
    return [
      { label: "Today", Production: prod, Consumption: cons },
      { label: "Day 2", Production: prod, Consumption: cons },
      { label: "Day 3", Production: prod, Consumption: cons },
    ];
  }, [productionKwh, consumptionKwh]);

  async function handleProd() {
    setErrorMsg(null);
    setLoadingProd(true);
    try {
      const resp = await fetch(PROD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prodForm),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || "Failed to fetch production");
      setProductionKwh(Number(json?.predicted_energy_kwh ?? 0));
    } catch (e: any) {
      setErrorMsg(e?.message || "Production request failed");
    } finally {
      setLoadingProd(false);
    }
  }

  async function handleCons() {
    setErrorMsg(null);
    setLoadingCons(true);
    try {
      const resp = await fetch(CONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consForm),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.detail || json?.error || "Failed to fetch consumption");
      setConsumptionKwh(Number(json?.daily_consumption ?? 0));
    } catch (e: any) {
      setErrorMsg(e?.message || "Consumption request failed");
    } finally {
      setLoadingCons(false);
    }
  }

  async function handleRecommend() {
    if (productionKwh == null || consumptionKwh == null) return;
    setErrorMsg(null);
    setLoadingReco(true);
    try {
      const payload = {
        production_kwh: [productionKwh, productionKwh, productionKwh],
        consumption_kwh: [consumptionKwh, consumptionKwh, consumptionKwh],
      };
      const resp = await fetch(RECO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.detail || json?.error || "Failed to get recommendation");
      setReco(json);
    } catch (e: any) {
      setErrorMsg(e?.message || "Recommendation request failed");
    } finally {
      setLoadingReco(false);
    }
  }

  return (
    <Page>
      <h1 className="text-3xl font-bold">AI Forecast</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Production and Consumption forecasts with actionable recommendation.
      </p>

      {errorMsg && (
        <div className="mt-4 rounded-md border border-red-900/40 bg-red-950/40 p-3 text-sm text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">Production Forecast</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>City</span>
              <Input
                value={prodForm.city}
                onChange={(e) => setProdForm({ ...prodForm, city: e.target.value })}
                placeholder="City name"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Capacity (kW)</span>
              <Input
                type="number"
                value={prodForm.capacity_kw}
                onChange={(e) => setProdForm({ ...prodForm, capacity_kw: Number(e.target.value) })}
                min={0}
                step={0.1}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Efficiency (0-1)</span>
              <Input
                type="number"
                value={prodForm.efficiency}
                onChange={(e) => setProdForm({ ...prodForm, efficiency: Number(e.target.value) })}
                min={0}
                max={1}
                step={0.01}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Past Avg (kWh)</span>
              <Input
                type="number"
                value={prodForm.past_avg_kwh}
                onChange={(e) => setProdForm({ ...prodForm, past_avg_kwh: Number(e.target.value) })}
                min={0}
                step={0.1}
              />
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleProd} disabled={loadingProd}>
              {loadingProd ? "Predicting..." : "Get Production"}
            </Button>
            {productionKwh != null && (
              <div className="text-sm text-muted-foreground">Predicted: <span className="font-semibold text-primary">{productionKwh.toFixed(2)} kWh</span></div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">Consumption Forecast</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <LabeledNumber
              label="Total appliances"
              value={consForm.num_appliances}
              onChange={(v) => setConsForm({ ...consForm, num_appliances: v })}
            />
            <LabeledNumber
              label="Heavy appliances"
              value={consForm.num_heavy}
              onChange={(v) => setConsForm({ ...consForm, num_heavy: v })}
            />
            <LabeledNumber
              label="Light appliances"
              value={consForm.num_light}
              onChange={(v) => setConsForm({ ...consForm, num_light: v })}
            />
            <LabeledNumber
              label="Avg heavy wattage"
              value={consForm.avg_heavy_wattage}
              onChange={(v) => setConsForm({ ...consForm, avg_heavy_wattage: v })}
              step={10}
            />
            <LabeledNumber
              label="Avg light wattage"
              value={consForm.avg_light_wattage}
              onChange={(v) => setConsForm({ ...consForm, avg_light_wattage: v })}
              step={5}
            />
            <LabeledNumber
              label="Avg usage hours"
              value={consForm.avg_usage_hours}
              onChange={(v) => setConsForm({ ...consForm, avg_usage_hours: v })}
              step={0.5}
            />
            <LabeledNumber
              label="Day type (0=weekday,1=weekend)"
              value={consForm.day_type}
              onChange={(v) => setConsForm({ ...consForm, day_type: v })}
            />
            <LabeledNumber
              label="Prev day consumption (kWh)"
              value={consForm.prev_day_consumption}
              onChange={(v) => setConsForm({ ...consForm, prev_day_consumption: v })}
              step={0.1}
            />
            <LabeledNumber
              label="Humidity (%)"
              value={consForm.humidity}
              onChange={(v) => setConsForm({ ...consForm, humidity: v })}
              step={1}
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleCons} disabled={loadingCons}>
              {loadingCons ? "Predicting..." : "Get Consumption"}
            </Button>
            {consumptionKwh != null && (
              <div className="text-sm text-muted-foreground">Predicted: <span className="font-semibold text-primary">{consumptionKwh.toFixed(2)} kWh</span></div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-card/60 p-6 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">3-day Overview</h2>
          <Button
            onClick={handleRecommend}
            disabled={loadingReco || productionKwh == null || consumptionKwh == null}
          >
            {loadingReco ? "Analyzing..." : "Get Recommendation"}
          </Button>
        </div>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#223" />
              <XAxis dataKey="label" stroke="#556" />
              <YAxis stroke="#556" />
              <Tooltip contentStyle={{ background: "#0b0f1a", border: "1px solid #223" }} />
              <Bar dataKey="Production" fill="#ffbf00" />
              <Bar dataKey="Consumption" fill="#6f9bff" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {reco && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-background/60 p-4">
              <h3 className="text-sm text-muted-foreground">Totals</h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>Production</div>
                <div className="text-right font-semibold text-primary">{Number(reco.total_production ?? 0).toFixed(2)} kWh</div>
                <div>Consumption</div>
                <div className="text-right font-semibold text-primary">{Number(reco.total_consumption ?? 0).toFixed(2)} kWh</div>
                <div>Net Balance</div>
                <div className="text-right font-semibold text-primary">{Number(reco.net_balance ?? 0).toFixed(2)} kWh</div>
              </div>
            </div>
            <div className="rounded-xl border bg-background/60 p-4">
              <h3 className="text-sm text-muted-foreground">Recommendation</h3>
              <div className="mt-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Action</span>
                  <span className="font-semibold text-primary">{reco.recommendation?.action}</span>
                </div>
                <div className="mt-1 text-muted-foreground">{reco.recommendation?.reason}</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>Confidence</div>
                  <div className="text-right">{reco.recommendation?.confidence}</div>
                  <div>Suggested amount</div>
                  <div className="text-right">{Number(reco.recommendation?.suggested_amount ?? 0).toFixed(2)} kWh</div>
                  <div>Keep amount</div>
                  <div className="text-right">{Number(reco.recommendation?.keep_amount ?? 0).toFixed(2)} kWh</div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 rounded-xl border bg-background/60 p-4">
              <h3 className="text-sm text-muted-foreground">Daily Balances</h3>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {(reco.daily_balances ?? []).map((d: any) => (
                  <div key={d.day} className="rounded-lg border p-3 text-sm">
                    <div className="mb-1 font-medium">Day {d.day}</div>
                    <div className="flex items-center justify-between">
                      <span>Production</span>
                      <span className="font-semibold text-primary">{Number(d.production ?? 0).toFixed(2)} kWh</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Consumption</span>
                      <span className="font-semibold text-primary">{Number(d.consumption ?? 0).toFixed(2)} kWh</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Balance</span>
                      <span className="font-semibold text-primary">{Number(d.balance ?? 0).toFixed(2)} kWh</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}

function LabeledNumber({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span>{label}</span>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
      />
    </label>
  );
}
