import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Download, Lightbulb, Mail, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const StatCard = ({
  label,
  value,
  change,
  color,
  showChange = true,
}: {
  label: string;
  value: string;
  change: number;
  color: string;
  showChange?: boolean;
}) => {
  const positive = change >= 0;
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-muted-foreground text-sm mb-2">{label}</p>
      <p className={`text-2xl font-bold ${color} mb-2`}>{value}</p>
      {showChange ? (
        <p className={`text-xs flex items-center gap-1 ${positive ? "text-green-400" : "text-red-400"}`}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {positive ? "+" : ""}{change}% vs prior 30 days
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">All-time total</p>
      )}
    </div>
  );
};

export default function Reports() {
  const [cards, setCards] = useState({ totalUsers: 0, activeUsers: 0, totalTransactions: 0, platformRevenue: 0 });
  const [changes, setChanges] = useState({ activeUsers: 0, transactions: 0, revenue: 0 });
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number; txns: number }[]>([]);
  const [energyTradingData, setEnergyTradingData] = useState<{ name: string; kwh: number }[]>([]);
  const [energyHoldingData, setEnergyHoldingData] = useState<{ name: string; kwh: number }[]>([]);
  const [hourlyActivityData, setHourlyActivityData] = useState<{ hour: string; txns: number }[]>([]);
  const [verificationSummary, setVerificationSummary] = useState({ pending: 0, verified: 0, rejected: 0 });
  const [txnStatus, setTxnStatus] = useState({ completed: 0, pending: 0, failed: 0 });
  const [insights, setInsights] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailing, setEmailing] = useState(false);

  const getBackend = () =>
    (typeof window !== "undefined" && (window as any).__POWERFLOW_API__) ||
    (import.meta as any).env?.VITE_BACKEND_BASE_URL ||
    "http://localhost:4000";

  useEffect(() => {
    const BACKEND = getBackend();
    const token = localStorage.getItem("powerflow.token") || "";
    const headers = { Authorization: `Bearer ${token}` };

    const buildLocalInsights = (d: any) => {
      const peak = Array.isArray(d.userActivity)
        ? d.userActivity.reduce(
            (best: any, row: any) =>
              Number(row.count || 0) > Number(best.count || 0) ? row : best,
            { _id: { hour: 0 }, count: 0 }
          )
        : { _id: { hour: 0 }, count: 0 };
      const top = Array.isArray(d.energyTradingBySource) && d.energyTradingBySource[0]
        ? d.energyTradingBySource[0]
        : { _id: "N/A", totalKwh: 0 };
      const failed = Number(d.txnStatusBreakdown?.failed || 0);
      const total = Number(d.totalTransactions || 0);
      const pending = Number(d.verificationSummary?.pending || 0);
      return [
        {
          id: "peak_hour",
          title: "Peak trading hour",
          detail: `Most transactions happen around ${String(peak._id?.hour || 0).padStart(2, "0")}:00 (${peak.count || 0} txns).`,
          severity: "info",
        },
        {
          id: "top_source",
          title: "Top energy source",
          detail: `${top._id || "Unknown"} leads listings with ${Number(top.totalKwh || 0).toLocaleString()} kWh.`,
          severity: "success",
        },
        {
          id: "kyc_backlog",
          title: "KYC backlog",
          detail: `${pending} verification item(s) pending review.`,
          severity: pending > 0 ? "warning" : "success",
        },
        {
          id: "failed_rate",
          title: "Failed transaction rate",
          detail: total
            ? `${((failed / total) * 100).toFixed(1)}% failed (${failed}/${total}).`
            : "No transactions yet.",
          severity: failed > 0 ? "warning" : "info",
        },
        {
          id: "revenue_snapshot",
          title: "Platform revenue snapshot",
          detail: `Current platform revenue is ₹${Number(d.platformRevenue || 0).toLocaleString()} across ${total} transactions.`,
          severity: "success",
        },
      ];
    };

    const load = async () => {
      try {
        setError(null);
        const res = await fetch(`${BACKEND}/api/admin/analytics`, {
          headers,
          cache: "no-store",
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.message || "Failed to load analytics");
        const d = j?.data || j;

        // Enrich empty KYC / txn breakdown from Power BI endpoints (same DB truth)
        let verificationSummary = {
          pending: Number(d.verificationSummary?.pending || 0),
          verified: Number(d.verificationSummary?.verified || 0),
          rejected: Number(d.verificationSummary?.rejected || 0),
        };
        let txnStatus = {
          completed: Number(d.txnStatusBreakdown?.completed || 0),
          pending: Number(d.txnStatusBreakdown?.pending || 0),
          failed: Number(d.txnStatusBreakdown?.failed || 0),
        };

        const needEnrich =
          verificationSummary.pending + verificationSummary.verified + verificationSummary.rejected === 0 ||
          txnStatus.completed + txnStatus.pending + txnStatus.failed === 0;

        if (needEnrich) {
          try {
            const [kpiRes, verRes] = await Promise.all([
              fetch(`${BACKEND}/api/admin/powerbi/kpis`, { headers, cache: "no-store" }),
              fetch(`${BACKEND}/api/admin/powerbi/verification-summary`, { headers, cache: "no-store" }),
            ]);
            const kpiJson = await kpiRes.json();
            const verJson = await verRes.json();
            if (Array.isArray(kpiJson?.data)) {
              const get = (name: string) =>
                Number(kpiJson.data.find((x: any) => x.metric === name)?.value || 0);
              const pendingTx = get("Pending Transactions");
              const failedTx = get("Failed Transactions");
              const totalTx = get("Total Transactions") || Number(d.totalTransactions || 0);
              txnStatus = {
                completed: Math.max(totalTx - pendingTx - failedTx, 0),
                pending: pendingTx,
                failed: failedTx,
              };
            }
            if (Array.isArray(verJson?.data)) {
              const sum = (status: string) =>
                verJson.data
                  .filter((r: any) => String(r.status || "").toLowerCase().includes(status))
                  .reduce((a: number, r: any) => a + Number(r.count || 0), 0);
              verificationSummary = {
                pending: sum("pending") + sum("under"),
                verified: sum("approved"),
                rejected: sum("rejected"),
              };
            }
          } catch {
            // keep primary analytics values
          }
        }

        const merged = { ...d, verificationSummary, txnStatusBreakdown: txnStatus };
        setCards({
          totalUsers: Number(d.totalUsers || 0),
          activeUsers: Number(d.activeUsers || 0),
          totalTransactions: Number(d.totalTransactions || 0),
          platformRevenue: Number(d.platformRevenue || 0),
        });
        setChanges({
          activeUsers: Number(d.changes?.activeUsers || 0),
          transactions: Number(d.changes?.transactions || 0),
          revenue: Number(d.changes?.revenue || 0),
        });
        setRevenueData(
          Array.isArray(d.revenueTrend)
            ? d.revenueTrend.map((it: any) => ({
                month: monthNames[(it._id?.month || 1) - 1],
                revenue: Number(it.totalRevenue || 0),
                txns: Number(it.txnCount || 0),
              }))
            : []
        );
        setEnergyTradingData(
          Array.isArray(d.energyTradingBySource)
            ? d.energyTradingBySource.map((it: any) => ({
                name: it._id || it.source || "Source",
                kwh: Number(it.totalKwh || 0),
              }))
            : []
        );
        setEnergyHoldingData(
          Array.isArray(d.energyHoldingBySource)
            ? d.energyHoldingBySource.map((it: any) => ({
                name: it._id || it.source || "Source",
                kwh: Number(it.totalKwh || 0),
              }))
            : []
        );
        setHourlyActivityData(
          Array.isArray(d.userActivity)
            ? d.userActivity.map((x: any) => ({
                hour: `${String(x._id?.hour || 0).padStart(2, "0")}:00`,
                txns: Number(x.count || 0),
              }))
            : []
        );
        setVerificationSummary(verificationSummary);
        setTxnStatus(txnStatus);
        const apiInsights = Array.isArray(d.insights) ? d.insights : [];
        setInsights(apiInsights.length ? apiInsights : buildLocalInsights(merged));
      } catch (e: any) {
        setError(e?.message || "Failed to load analytics");
      }
    };
    load();
  }, []);

  const exportExcelCsv = () => {
    try {
      const lines: string[] = [];
      lines.push("Metric,Value");
      lines.push(`Total Users,${cards.totalUsers}`);
      lines.push(`Active Users,${cards.activeUsers}`);
      lines.push(`Total Transactions,${cards.totalTransactions}`);
      lines.push(`Platform Revenue,${cards.platformRevenue}`);
      lines.push("");
      lines.push("Revenue Trend");
      lines.push("Month,Revenue,Transactions");
      revenueData.forEach((r) => lines.push(`${r.month},${r.revenue},${r.txns}`));
      lines.push("");
      lines.push("Energy Trading By Source");
      lines.push("Source,kWh");
      energyTradingData.forEach((e) => lines.push(`${e.name},${e.kwh}`));
      lines.push("");
      lines.push("Energy Holding By Source");
      lines.push("Source,kWh");
      energyHoldingData.forEach((e) => lines.push(`${e.name},${e.kwh}`));
      lines.push("");
      lines.push("User Activity");
      lines.push("Hour,Transactions");
      hourlyActivityData.forEach((a) => lines.push(`${a.hour},${a.txns}`));
      lines.push("");
      lines.push("Verification Summary");
      lines.push("Status,Count");
      lines.push(`Pending,${verificationSummary.pending}`);
      lines.push(`Verified,${verificationSummary.verified}`);
      lines.push(`Rejected,${verificationSummary.rejected}`);
      lines.push("");
      lines.push("EDA Insights");
      lines.push("Title,Detail");
      insights.forEach((i) => lines.push(`"${i.title}","${(i.detail || "").replace(/"/g, "'")}"`));

      // UTF-8 BOM so Excel opens CSV cleanly
      const blob = new Blob(["\uFEFF" + lines.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `powerflow_eda_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed");
    }
  };

  const emailReport = async () => {
    try {
      setEmailing(true);
      setEmailMsg(null);
      const BACKEND = getBackend();
      const token = localStorage.getItem("powerflow.token") || "";
      const res = await fetch(`${BACKEND}/api/admin/analytics/email-report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const raw = await res.text();
      let j: any = null;
      try {
        j = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(
          res.status === 404
            ? "Email report API not found. Restart powerflow-backend so POST /api/admin/analytics/email-report is loaded."
            : `Server returned non-JSON (HTTP ${res.status}). Is the backend running at ${BACKEND}?`
        );
      }
      if (!res.ok) throw new Error(j?.message || "Email failed");
      setEmailMsg(j.message || "Report emailed");
    } catch (e: any) {
      setEmailMsg(e?.message || "Email failed");
    } finally {
      setEmailing(false);
    }
  };

  const verificationChart = [
    { name: "Pending", value: verificationSummary.pending },
    { name: "Verified", value: verificationSummary.verified },
    { name: "Rejected", value: verificationSummary.rejected },
  ];
  const txnChart = [
    { name: "Completed", value: txnStatus.completed },
    { name: "Pending", value: txnStatus.pending },
    { name: "Failed", value: txnStatus.failed },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">EDA & KPI Reporting</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Explore transaction, user, energy, and verification trends for admin decisions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={emailReport}
            disabled={emailing}
            variant="outline"
            className="flex items-center gap-2 w-fit"
          >
            <Mail className="w-4 h-4" />
            {emailing ? "Sending..." : "Email Report"}
          </Button>
          <Button
            onClick={exportExcelCsv}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center gap-2 w-fit"
          >
            <Download className="w-4 h-4" />
            Export Excel/CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}
      {emailMsg && (
        <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-3 text-sm text-blue-200">{emailMsg}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={cards.totalUsers.toLocaleString()} change={0} color="text-blue-400" showChange={false} />
        <StatCard label="Active Users" value={cards.activeUsers.toLocaleString()} change={changes.activeUsers} color="text-green-400" />
        <StatCard label="Total Transactions" value={cards.totalTransactions.toLocaleString()} change={changes.transactions} color="text-orange-400" />
        <StatCard label="Platform Revenue" value={`₹${cards.platformRevenue.toLocaleString()}`} change={changes.revenue} color="text-purple-400" />
      </div>

      {/* Actionable EDA insights */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-foreground">Actionable Insights (EDA)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.length === 0 && (
            <p className="text-sm text-muted-foreground">Insights will appear once analytics data is available.</p>
          )}
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`rounded-lg border p-3 ${
                insight.severity === "warning"
                  ? "border-yellow-500/30 bg-yellow-500/10"
                  : insight.severity === "success"
                    ? "border-green-500/30 bg-green-500/10"
                    : "border-blue-500/30 bg-blue-500/10"
              }`}
            >
              <p className="text-sm font-medium text-foreground">{insight.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{insight.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">Revenue Trend (6 Months)</h3>
            <p className="text-muted-foreground text-sm">Completed transaction revenue</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">Energy Trading by Source</h3>
            <p className="text-muted-foreground text-sm">Last 6 months</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={energyTradingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="kwh" name="kWh" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">Energy Holding by Source</h3>
            <p className="text-muted-foreground text-sm">Current distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={energyHoldingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="kwh" name="kWh" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">24-Hour User Activity</h3>
            <p className="text-muted-foreground text-sm">Peak usage analysis</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="txns" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">Verification / KYC Status</h3>
            <p className="text-muted-foreground text-sm">User verification pipeline</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={verificationChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="value" fill="#a855f7" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">Transaction Status Breakdown</h3>
            <p className="text-muted-foreground text-sm">Completed vs pending vs failed</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={txnChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
