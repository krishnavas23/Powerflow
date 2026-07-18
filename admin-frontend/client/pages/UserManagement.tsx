import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input as TextInput } from "@/components/ui/input";
import { Search, Plus, Filter, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Sample user data (unused after backend integration)
const usersData = [
  {
    id: 1,
    name: "Alex Brown",
    contact: "alex.brown@email.com",
    phone: "+1 (555) 987-6543",
    status: "Active",
    wallet: "$1,250.50",
    transactions: 45,
    energyCredits: "1,200 kWh",
    joined: "2023-08-15",
  },
  {
    id: 2,
    name: "Sarah Wilson",
    contact: "sarah.w@email.com",
    phone: "+1 (555) 876-5432",
    status: "Active",
    wallet: "$2,150.75",
    transactions: 67,
    energyCredits: "2,500 kWh",
    joined: "2023-07-22",
  },
  {
    id: 3,
    name: "John Davis",
    contact: "john.davis@email.com",
    phone: "+1 (555) 765-4321",
    status: "Suspended",
    wallet: "$450.00",
    transactions: 23,
    energyCredits: "500 kWh",
    joined: "2023-09-10",
  },
  {
    id: 4,
    name: "Emily Chen",
    contact: "emily.chen@email.com",
    phone: "+1 (555) 654-3210",
    status: "Active",
    wallet: "$3,200.25",
    transactions: 92,
    energyCredits: "4,100 kWh",
    joined: "2023-06-05",
  },
  {
    id: 5,
    name: "Michael Park",
    contact: "michael.park@email.com",
    phone: "+1 (555) 543-2109",
    status: "Active",
    wallet: "$1,850.00",
    transactions: 56,
    energyCredits: "1,800 kWh",
    joined: "2023-08-28",
  },
];

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
    case "Active":
      return "bg-green-500/20 text-green-300 border-green-500/30";
    case "Suspended":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    case "Pending":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    default:
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
  }
};

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, verifiedUsers: 0, suspendedUsers: 0 });
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "Buyer", accountType: "Individual" });

  useEffect(() => {
    const BACKEND = (typeof window !== 'undefined' && (window as any).__POWERFLOW_API__)
      || (import.meta as any).env?.VITE_BACKEND_BASE_URL
      || 'http://localhost:4000';
    const token = localStorage.getItem('powerflow.token') || '';
    const load = async () => {
      try {
        setError(null);
        const [sRes, uRes] = await Promise.all([
          fetch(`${BACKEND}/api/admin/users/stats`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
          fetch(`${BACKEND}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
        ]);
        const sJson = await sRes.json();
        const uJson = await uRes.json();
        if (sRes.ok && sJson) {
          setStats({
            totalUsers: Number(sJson.totalUsers || 0),
            activeUsers: Number(sJson.activeUsers || 0),
            verifiedUsers: Number(sJson.verifiedUsers || 0),
            suspendedUsers: Number(sJson.suspendedUsers || 0),
          });
        }
        if (!uRes.ok) throw new Error(uJson?.message || 'Failed to load users');
        const mapped = Array.isArray(uJson) ? uJson.map((u: any) => ({
          id: String(u._id),
          name: u.name || 'User',
          contact: u.email || '',
          phone: u.profile?.phone || '',
          status: u.isVerified ? 'Active' : 'Suspended',
          walletInr: Number(u.wallet?.walletBalance ?? u.walletBalance ?? 0),
          transactions: Number(u.transactionsCount ?? 0),
          energyCredits: Number(u.wallet?.energyCredits ?? u.energyCredits ?? 0),
          joined: new Date(u.createdAt || Date.now()).toISOString().slice(0,10),
        })) : [];
        setUsers(mapped);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      }
    };
    load();
  }, []);

  const BACKEND = (typeof window !== 'undefined' && (window as any).__POWERFLOW_API__)
    || (import.meta as any).env?.VITE_BACKEND_BASE_URL
    || 'http://localhost:4000';

  const create = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('powerflow.token') || '';
      const res = await fetch(`${BACKEND}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          passwordHash: newUser.password,
          role: newUser.role,
          accountType: newUser.accountType,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to create user');
      // optimistic add
      setUsers((arr) => ([{ id: data.newUser?._id || data._id, name: newUser.name, contact: newUser.email, phone: '', status: 'Suspended', walletInr: 0, transactions: 0, energyCredits: 0, joined: new Date().toISOString().slice(0,10) }, ...arr]));
      setOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "Buyer", accountType: "Individual" });
    } catch (e: any) {
      setError(e?.message || 'Failed to create user');
    }
  };

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "All" || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  }), [users, searchTerm, filterStatus]);

  return (
    <>
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            User Management
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage platform users and view their activity
          </p>
        </div>
        <Button onClick={()=>setOpen(true)} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} color="text-blue-400" />
        <StatCard label="Active Users" value={stats.activeUsers.toLocaleString()} color="text-green-400" />
        <StatCard
          label="Verified Users"
          value={stats.verifiedUsers.toLocaleString()}
          color="text-purple-400"
        />
        <StatCard label="Suspended" value={stats.suspendedUsers.toLocaleString()} color="text-red-400" />
      </div>

      {/* Users List */}
      <div className="bg-card border border-border rounded-lg">
        {/* Search and Filter */}
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or ID..."
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
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
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
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Wallet
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Energy Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user: any) => (
                <tr
                  key={user.id}
                  className="border-b border-border hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {user.name[0]}
                      </div>
                      <span className="font-medium text-foreground text-sm">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-foreground text-sm">{user.contact}</p>
                      {user.phone && (
                        <p className="text-muted-foreground text-xs">{user.phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        user.status,
                      )}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-foreground font-medium text-sm">₹{Number(user.walletInr || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-foreground text-sm">
                      {user.transactions ?? '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-green-400 font-medium text-sm">{Number(user.energyCredits || 0).toLocaleString()} kWh</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-muted-foreground text-sm">
                      {user.joined}
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <TextInput placeholder="Full name" value={newUser.name} onChange={(e)=>setNewUser({...newUser, name: e.target.value})} />
          <TextInput placeholder="Email" type="email" value={newUser.email} onChange={(e)=>setNewUser({...newUser, email: e.target.value})} />
          <TextInput placeholder="Temporary password" type="password" value={newUser.password} onChange={(e)=>setNewUser({...newUser, password: e.target.value})} />
          <div className="grid grid-cols-2 gap-2">
            <select className="px-3 py-2 rounded border bg-background" value={newUser.role} onChange={(e)=>setNewUser({...newUser, role: e.target.value})}>
              <option value="Buyer">Buyer</option>
              <option value="Producer">Producer</option>
            </select>
            <select className="px-3 py-2 rounded border bg-background" value={newUser.accountType} onChange={(e)=>setNewUser({...newUser, accountType: e.target.value})}>
              <option value="Individual">Individual</option>
              <option value="Company">Company</option>
              <option value="NGO">NGO</option>
              <option value="Hospital">Hospital</option>
              <option value="Producer">Producer</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
