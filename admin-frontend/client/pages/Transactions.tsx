import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Filter, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Txn = {
  id: string;
  user: string;
  type: string;
  amountInr: number;
  valueKwh?: number;
  method?: string;
  status: 'Completed' | 'Pending' | 'Failed';
  dateTime: string;
};

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <p className="text-muted-foreground text-sm mb-2">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed":
      return "bg-green-500/20 text-green-300 border-green-500/30";
    case "Pending":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case "Failed":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    default:
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "Transfer":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "Purchase":
      return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case "Refund":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "Withdrawal":
      return "bg-pink-500/20 text-pink-300 border-pink-500/30";
    default:
      return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
  }
};

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [txns, setTxns] = useState<Txn[]>([]);
  const [stats, setStats] = useState({ total: 0, todayVolume: 0, pending: 0, failed: 0 });
  const [error, setError] = useState<string | null>(null);
  const BACKEND = (typeof window !== 'undefined' && (window as any).__POWERFLOW_API__)
    || (import.meta as any).env?.VITE_BACKEND_BASE_URL
    || 'http://localhost:4000';

  useEffect(() => {
    const token = localStorage.getItem('powerflow.token') || '';
    const load = async () => {
      try {
        setError(null);
        const [sRes, tRes] = await Promise.all([
          fetch(`${BACKEND}/api/admin/transactions/stats`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
          fetch(`${BACKEND}/api/admin/transactions`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
        ]);
        const sJson = await sRes.json();
        const tJson = await tRes.json();
        if (sRes.ok && sJson) {
          setStats({
            total: Number(sJson.total || sJson.count || 0),
            todayVolume: Number(sJson.todayVolume || sJson.todayValue || 0),
            pending: Number(sJson.pending || 0),
            failed: Number(sJson.failed || 0),
          });
        }
        if (!tRes.ok) throw new Error(tJson?.message || 'Failed to load transactions');
        const src = Array.isArray(tJson)
          ? tJson
          : Array.isArray((tJson as any)?.transactions)
          ? (tJson as any).transactions
          : Array.isArray((tJson as any)?.data?.transactions)
          ? (tJson as any).data.transactions
          : [];
        const mapped: Txn[] = src.map((it: any) => ({
          id: it._id || it.id,
          user: it.user?.name || it.buyer?.name || it.seller?.name || it.userName || 'User',
          type: (it.type || '').toString().replace(/_/g, ' ').replace(/\b\w/g, (m: string)=>m.toUpperCase()) || 'Trade',
          amountInr: Number(it.totalAmount ?? it.amount ?? 0),
          valueKwh: Number(it.kwh ?? it.valueKwh ?? 0),
          method: it.method || it.paymentMethod || '-',
          status: ((it.status || 'COMPLETED').toString().toLowerCase() === 'completed' ? 'Completed' : (it.status || '').toString().toLowerCase() === 'pending' ? 'Pending' : 'Failed') as any,
          dateTime: (()=>{ try { return new Date(it.createdAt || it.date || it.timestamp || Date.now()).toISOString().replace('T',' ').slice(0,16);} catch { return '';} })(),
        }));
        setTxns(mapped);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      }
    };
    load();
  }, []);

  // Keep cards in sync when the list updates (fallback if stats endpoint is stale)
  useEffect(() => {
    setStats((s) => ({
      ...s,
      total: txns.length || s.total,
      pending: txns.filter((t) => t.status === 'Pending').length,
      failed: txns.filter((t) => t.status === 'Failed').length,
    }));
  }, [txns]);

  const onExport = async () => {
    try {
      const token = localStorage.getItem('powerflow.token') || '';
      const res = await fetch(`${BACKEND}/api/admin/transactions/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as any)?.message || 'Export failed');
    }
  };

  const filteredTransactions = useMemo(() => txns.filter((txn) => {
    const matchesSearch =
      txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || txn.status === filterStatus;
    return matchesSearch && matchesFilter;
  }), [txns, searchTerm, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Transaction Management
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor and manage all platform transactions
          </p>
        </div>
        <Button onClick={onExport} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Transactions"
          value={stats.total.toLocaleString()}
          color="text-blue-400"
        />
        <StatCard label="Today's Volume" value={`₹${stats.todayVolume.toLocaleString()}`} color="text-green-400" />
        <StatCard label="Pending" value={stats.pending.toString()} color="text-yellow-400" />
        <StatCard label="Failed" value={stats.failed.toString()} color="text-red-400" />
      </div>

      {/* Transactions List */}
      <div className="bg-card border border-border rounded-lg">
        {/* Search and Filter */}
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by transaction ID or user..."
                className="pl-10 bg-white/5 border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-border text-foreground text-sm cursor-pointer hover:bg-white/10 transition-colors"
              >
                <option value="All">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10"
              >
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="border-b border-border hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-foreground text-sm">
                      {txn.id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-foreground text-sm">{txn.user}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(
                        txn.type,
                      )}`}
                    >
                      {txn.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-orange-400 font-medium text-sm">₹{txn.amountInr.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-foreground text-sm">{txn.valueKwh ? `${txn.valueKwh.toLocaleString()} kWh` : '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-foreground text-sm">
                      {txn.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        txn.status,
                      )}`}
                    >
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-muted-foreground text-sm">
                      {txn.dateTime}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
