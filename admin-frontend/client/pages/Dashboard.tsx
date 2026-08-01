import {
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  Activity,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useEffect, useState } from "react";

// Fallback data for charts
const fallbackRevenueChart = [
  { name: "Mon", value: 0 },
  { name: "Tue", value: 0 },
  { name: "Wed", value: 0 },
  { name: "Thu", value: 0 },
  { name: "Fri", value: 0 },
  { name: "Sat", value: 0 },
  { name: "Sun", value: 0 },
];


const StatCard = ({
  icon: Icon,
  label,
  value,
  change,
  isPositive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}) => (
  <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-colors">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-muted-foreground text-sm font-medium mb-2">
          {label}
        </p>
        <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span
            className={isPositive ? "text-green-500" : "text-red-500"}
            style={{ fontSize: "0.875rem" }}
          >
            {change}
          </span>
        </div>
      </div>
      <div className="flex-shrink-0">{Icon}</div>
    </div>
  </div>
);

export default function Dashboard() {
  const [totals, setTotals] = useState({
    totalUsers: 0,
    activeEnergy: 0,
    totalRevenue: 0,
    todayVolume: 0,
  });
  const [changes, setChanges] = useState({
    totalUsers: 0,
    activeEnergy: 0,
    totalRevenue: 0,
    todayVolume: 0,
  });
  const [trend, setTrend] = useState<{ name: string; value: number }[]>(fallbackRevenueChart);
  const [energyBars, setEnergyBars] = useState<{ name: string; value: number }[]>([
    { name: 'Active', value: 0 },
    { name: 'Reserved', value: 0 },
  ]);
  const [activities, setActivities] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const BACKEND_BASE_URL = (typeof window !== 'undefined' && (window as any).__POWERFLOW_API__) 
          || (import.meta as any).env?.VITE_BACKEND_BASE_URL 
          || 'http://localhost:4000';
        const res = await fetch(`${BACKEND_BASE_URL}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('powerflow.token') || ''}` },
          cache: 'no-store',
        });
        const data = await res.json();
        if (res.ok && data) {
          const totalUsers = Number(data.totalUsers ?? data.users ?? 0);
          const activeEnergy = Number(data.activeEnergy ?? data.energy ?? 0);
          const totalRevenue = Number(data.totalRevenue ?? data.revenue ?? 0);
          const todayVolume = Number(data.todayVolume ?? data.txnCount ?? 0);
          const rawTrend = Array.isArray(data.revenueTrend) ? data.revenueTrend : [];
          // Pad last 7 calendar days so chart never looks blank when recent days have 0 revenue
          const byDay: Record<string, number> = {};
          rawTrend.forEach((p: any) => {
            const key = p._id || p.day || p.date || '';
            if (key) byDay[key] = Number(p.total || p.value || 0);
          });
          const padded: { name: string; value: number }[] = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            padded.push({
              name: d.toLocaleDateString(undefined, { weekday: 'short' }),
              value: byDay[key] || 0,
            });
          }
          // If all zeros but historical points exist outside window, show those instead
          const hasRecent = padded.some((p) => p.value > 0);
          const revenueTrend = hasRecent
            ? padded
            : rawTrend.length
              ? rawTrend.map((p: any) => ({
                  name: p._id || p.day || p.date || '',
                  value: Number(p.total || p.value || 0),
                }))
              : fallbackRevenueChart;

          setTotals({ totalUsers, activeEnergy, totalRevenue, todayVolume });
          setTrend(revenueTrend);
          if (data.changes) {
            setChanges({
              totalUsers: Number(data.changes.totalUsers || 0),
              activeEnergy: Number(data.changes.activeEnergy || 0),
              totalRevenue: Number(data.changes.totalRevenue || 0),
              todayVolume: Number(data.changes.todayVolume || 0),
            });
          }
          if (data.energyDemand) {
            setEnergyBars([
              { name: 'Active', value: Number(data.energyDemand.active || 0) },
              { name: 'Reserved', value: Number(data.energyDemand.reserved || 0) },
            ]);
          }
          if (Array.isArray(data.recentActivity)) {
            const mapped = data.recentActivity.map((r: any) => ({
              id: r.id || r._id,
              user: r.user || 'System',
              action: r.action || r.type || 'Activity',
              amount: typeof r.amount === 'number' ? `₹${r.amount.toLocaleString()}` : (r.amount || ''),
              time: r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
              status: r.status || 'COMPLETED',
              type: 'transaction',
            }));
            setActivities(mapped);
          }
          if (Array.isArray(data.alerts)) {
            setSystemAlerts(data.alerts.map((a: any, idx: number) => ({
              id: idx + 1,
              title: a.message || a.title || 'Alert',
              description: a.description || '',
              severity: a.type || 'info',
            })));
          }
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load dashboard');
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back! Here's your platform overview
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
          }
          label="Total Users"
          value={totals.totalUsers.toLocaleString()}
          change={`${changes.totalUsers >= 0 ? "+" : ""}${changes.totalUsers}%`}
          isPositive={changes.totalUsers >= 0}
        />
        <StatCard
          icon={
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-green-500" />
            </div>
          }
          label="Active Energy"
          value={`${totals.activeEnergy.toLocaleString()} kWh`
          }
          change={`${changes.activeEnergy >= 0 ? "+" : ""}${changes.activeEnergy}%`}
          isPositive={changes.activeEnergy >= 0}
        />
        <StatCard
          icon={
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-500" />
            </div>
          }
          label="Total Revenue"
          value={`₹${totals.totalRevenue.toLocaleString()}`}
          change={`${changes.totalRevenue >= 0 ? "+" : ""}${changes.totalRevenue}%`}
          isPositive={changes.totalRevenue >= 0}
        />
        <StatCard
          icon={
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
          }
          label="Today's Volume"
          value={`${totals.todayVolume.toLocaleString()} txns`}
          change={`${changes.todayVolume >= 0 ? "+" : ""}${changes.todayVolume}%`}
          isPositive={changes.todayVolume >= 0}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Revenue Growth
            </h3>
            <p className="text-muted-foreground text-sm">7-day revenue trend</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(142 71.8% 40%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(142 71.8% 40%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(142 71.8% 40%)"
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Energy Demand Chart */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Energy Demand
            </h3>
            <p className="text-muted-foreground text-sm">
              Active vs Reserved energy
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={energyBars}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Bar dataKey="value" fill="hsl(38 92% 50%)" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity and System Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Recent Activity
            </h3>
          </div>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{
                      background: "hsl(210 100% 50%)",
                    }}
                  >
                    {activity.user[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate">
                      {activity.user}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {activity.action}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-foreground text-sm font-medium">
                    {activity.amount}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              System Alerts
            </h3>
          </div>
          <div className="space-y-3">
            {systemAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.severity === "warning"
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : alert.severity === "success"
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-blue-500/10 border-blue-500/30"
                }`}
              >
                <p
                  className={`font-medium text-sm mb-1 ${
                    alert.severity === "warning"
                      ? "text-yellow-300"
                      : alert.severity === "success"
                        ? "text-green-300"
                        : "text-blue-300"
                  }`}
                >
                  {alert.title}
                </p>
                <p className="text-muted-foreground text-xs">
                  {alert.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
