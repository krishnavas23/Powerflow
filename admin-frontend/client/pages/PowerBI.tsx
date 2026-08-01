import { useEffect, useMemo, useState } from "react";
import { BarChart3, Copy, Download, ExternalLink, KeyRound, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Dataset = {
  name: string;
  path: string;
  description: string;
};

const DATASETS: Dataset[] = [
  { name: "kpis", path: "/api/admin/powerbi/kpis", description: "Platform KPI snapshot" },
  { name: "transactions", path: "/api/admin/powerbi/transactions", description: "Transaction fact table" },
  { name: "revenue-daily", path: "/api/admin/powerbi/revenue-daily", description: "Daily revenue (90 days)" },
  { name: "revenue-monthly", path: "/api/admin/powerbi/revenue-monthly", description: "Monthly revenue (12 months)" },
  { name: "energy-by-source", path: "/api/admin/powerbi/energy-by-source", description: "Energy by source" },
  { name: "user-activity-hourly", path: "/api/admin/powerbi/user-activity-hourly", description: "Hourly transaction activity" },
  { name: "meter-daily", path: "/api/admin/powerbi/meter-daily", description: "Meter readings by day" },
  { name: "verification-summary", path: "/api/admin/powerbi/verification-summary", description: "KYC / verification counts" },
];

function getBackendBase() {
  return (
    (typeof window !== "undefined" && (window as any).__POWERFLOW_API__) ||
    (import.meta as any).env?.VITE_BACKEND_BASE_URL ||
    "http://localhost:4000"
  );
}

export default function PowerBI() {
  const [copied, setCopied] = useState<string | null>(null);
  const [catalogOk, setCatalogOk] = useState<boolean | null>(null);
  const [kpis, setKpis] = useState<{ metric: string; value: number; unit: string; category: string }[]>([]);
  const backend = getBackendBase();
  const embedUrl = (import.meta as any).env?.VITE_POWERBI_EMBED_URL || "";

  useEffect(() => {
    const token = localStorage.getItem("powerflow.token") || "";
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${backend}/api/admin/powerbi`, { headers, cache: "no-store" })
      .then((r) => setCatalogOk(r.ok))
      .catch(() => setCatalogOk(false));
    fetch(`${backend}/api/admin/powerbi/kpis`, { headers, cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j?.data)) setKpis(j.data);
      })
      .catch(() => {});
  }, [backend]);

  const powerQuerySnippet = useMemo(() => {
    return `let
    BaseUrl = "${backend}",

    Source =
        Json.Document(
            Web.Contents(
                BaseUrl & "/api/admin/powerbi/kpis?format=json",
                [
                    Headers = [
                        #"X-PowerBI-Key" = "YOUR_POWERBI_API_KEY"
                    ]
                ]
            )
        ),

    Rows = Source[data]
in
    Table.FromList(Rows, Splitter.SplitByNothing(), null, null, ExtraValues.Error)`;
  }, [backend]);

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied("error");
    }
  };

  const openCsv = (path: string) => {
    const token = localStorage.getItem("powerflow.token") || "";
    const url = `${backend}${path}?format=csv`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = path.split("/").pop() + ".csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-yellow-400" />
            Power BI Integration
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Connect Microsoft Power BI to PowerFlow analytics without rebuilding the app
          </p>
        </div>
        <a
          href="/powerbi.txt"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
        >
          <ExternalLink className="w-4 h-4" />
          Read powerbi.txt guide
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">API Status</p>
          <p className={`text-lg font-semibold ${catalogOk ? "text-green-400" : catalogOk === false ? "text-red-400" : "text-yellow-400"}`}>
            {catalogOk === null ? "Checking..." : catalogOk ? "Connected" : "Unavailable"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Backend Base URL</p>
          <p className="text-sm font-mono text-foreground break-all">{backend}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Datasets Available</p>
          <p className="text-lg font-semibold text-foreground">{DATASETS.length}</p>
        </div>
      </div>

      {kpis.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Live KPI Preview (from Power BI dataset)</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Same KPI feed Power BI Desktop connects to via <code className="font-mono">/api/admin/powerbi/kpis</code>.
            Platform Revenue = sum of COMPLETED TRADE + RECHARGE (same definition as EDA &amp; Dashboard).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.slice(0, 8).map((k) => (
              <div key={k.metric} className="rounded-lg border border-border bg-white/5 p-3">
                <p className="text-xs text-muted-foreground">{k.metric}</p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {k.unit === "INR" ? `₹${Number(k.value || 0).toLocaleString()}` : Number(k.value || 0).toLocaleString()}
                  {k.unit === "kWh" ? " kWh" : ""}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">{k.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {embedUrl ? (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Embedded Power BI Report</h3>
          <iframe
            title="Power BI Report"
            src={embedUrl}
            className="w-full h-[520px] rounded-lg border border-border"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-100 space-y-2">
          <p className="font-medium text-green-200">This Power BI page is complete for demos.</p>
          <p>
            Live KPI preview + 8 BI-ready datasets + CSV download + Power Query sample are ready.
            Embedding a published Power BI report is optional — only needed if you publish a
            <code className="font-mono mx-1">.pbix</code> to Power BI Service and set
            <code className="font-mono mx-1">VITE_POWERBI_EMBED_URL</code>.
          </p>
          <p className="text-xs text-green-200/80">
            Interview line: &quot;We expose BI-ready APIs; Power BI Desktop builds the advanced report.&quot;
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Authentication Options</h3>
        </div>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
          <li>
            <strong className="text-foreground">Admin JWT:</strong> use your logged-in admin token in header <code className="font-mono">Authorization: Bearer ...</code>
          </li>
          <li>
            <strong className="text-foreground">Service key:</strong> set <code className="font-mono">POWERBI_API_KEY</code> in backend <code className="font-mono">.env</code> and send header <code className="font-mono">X-PowerBI-Key</code> (best for scheduled refresh)
          </li>
        </ul>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold">BI-Ready Datasets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 pr-4">Dataset</th>
                <th className="text-left py-2 pr-4">Description</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {DATASETS.map((d) => (
                <tr key={d.name} className="border-b border-border/60">
                  <td className="py-3 pr-4 font-mono text-foreground">{d.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{d.description}</td>
                  <td className="py-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => copyText(d.name, `${backend}${d.path}`)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      {copied === d.name ? "Copied" : "Copy URL"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => openCsv(d.path)}>
                      <Download className="w-3 h-3 mr-1" />
                      CSV
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-3">
        <h3 className="text-lg font-semibold">Sample Power Query (M)</h3>
        <p className="text-sm text-muted-foreground">
          This example uses the Power BI Service API Key (X-PowerBI-Key). Replace YOUR_POWERBI_API_KEY with the value of POWERBI_API_KEY from your backend .env file.
        </p>
        <pre className="text-xs bg-black/40 border border-border rounded-lg p-4 overflow-x-auto text-green-200">
          {powerQuerySnippet}
        </pre>
        <Button size="sm" variant="outline" onClick={() => copyText("pq", powerQuerySnippet)}>
          <Copy className="w-3 h-3 mr-1" />
          {copied === "pq" ? "Copied" : "Copy Power Query"}
        </Button>
        <div className="rounded-lg border border-border bg-white/5 p-4 text-sm space-y-2">
          <p className="font-medium text-foreground">🔐 Authentication</p>
          <ul className="text-muted-foreground space-y-1.5 list-disc pl-5">
            <li>This query authenticates using the X-PowerBI-Key request header.</li>
            <li>Set POWERBI_API_KEY in powerflow-backend/.env.</li>
            <li>Replace YOUR_POWERBI_API_KEY before importing into Power BI Desktop.</li>
            <li>
              Select Anonymous authentication in Power BI when prompted, because authentication is already supplied through the custom HTTP header.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
