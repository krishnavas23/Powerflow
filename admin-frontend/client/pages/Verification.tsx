import { useEffect, useState } from "react";
import { Check, X, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
type RequestItem = {
  id: string;
  name: string;
  email: string;
  status: string;
  submittedDate: string;
  documents: string[];
  docStatus: string[];
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
    case "Pending":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case "Under Review":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "Approved":
      return "bg-green-500/20 text-green-300 border-green-500/30";
    case "Rejected":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  }
};

const getDocStatusIcon = (docStatus: string) => {
  switch (docStatus) {
    case "verified":
      return <Check className="w-4 h-4 text-green-400" />;
    case "rejected":
      return <X className="w-4 h-4 text-red-400" />;
    case "pending":
      return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    default:
      return null;
  }
};

export default function Verification() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [counts, setCounts] = useState({ pending: 0, underReview: 0, approvedToday: 0, rejectedToday: 0 });
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ open: boolean; title: string; docs: { name: string; base64?: string; contentType?: string }[] }>({ open: false, title: '', docs: [] });

  const load = async () => {
      try {
        setError(null);
        const BACKEND_BASE_URL = (typeof window !== 'undefined' && (window as any).__POWERFLOW_API__)
          || (import.meta as any).env?.VITE_BACKEND_BASE_URL
          || 'http://localhost:4000';
        const res = await fetch(`${BACKEND_BASE_URL}/api/admin/verifications`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('powerflow.token') || ''}` },
          cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load verifications');

        const src = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.requests) ? data.requests : [];
        const mapped: RequestItem[] = src.map((it: any) => ({
          id: it._id,
          name: it.userId?.name || it.name || 'User',
          email: it.userId?.email || it.email || 'unknown@email',
          status: it.overallStatus || it.status || 'Pending',
          submittedDate: new Date(it.createdAt || Date.now()).toISOString().slice(0, 10),
          documents: Array.isArray(it.documents) ? it.documents.map((d: any) => d.docType || d.type || 'Document') : [],
          docStatus: Array.isArray(it.documents) ? it.documents.map((d: any) => (d.status || 'Pending').toLowerCase()) : [],
        }));
        setItems(mapped);
        // Derive counts directly from the rendered list so cards and list stay in sync
        const derived = {
          pending: mapped.filter((r) => r.status === 'Pending').length,
          underReview: mapped.filter((r) => r.status === 'Under Review').length,
          approvedToday: mapped.filter((r) => r.status === 'Approved').length,
          rejectedToday: mapped.filter((r) => r.status === 'Rejected').length,
        };
        setCounts(derived);
      } catch (e: any) {
        setError(e?.message || 'Failed to load verifications');
      }
  };
  useEffect(() => { load(); }, []);

  // We rely on backend-provided counts; avoid overriding with client-side heuristics.

  const BACKEND = (typeof window !== 'undefined' && (window as any).__POWERFLOW_API__)
    || (import.meta as any).env?.VITE_BACKEND_BASE_URL
    || 'http://localhost:4000';

  const approve = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND}/api/admin/verifications/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('powerflow.token') || ''}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to approve');
      await load();
    } catch (e: any) { setError(e?.message || 'Approve failed'); }
  };

  const reject = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND}/api/admin/verifications/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('powerflow.token') || ''}` },
        body: JSON.stringify({ remarks: 'Rejected by admin' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to reject');
      await load();
    } catch (e: any) { setError(e?.message || 'Reject failed'); }
  };

  const viewDocs = async (id: string) => {
    try {
      setError(null);
      const res = await fetch(`${BACKEND}/api/admin/verifications/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('powerflow.token') || ''}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load documents');
      const docs = Array.isArray(data?.documents) ? data.documents.map((d: any) => ({ name: d.docType || d.type || d.filename || 'Document', base64: d.base64, contentType: d.contentType })) : [];
      setViewer({ open: true, title: data?.userId?.name || 'Documents', docs });
    } catch (e: any) { setError(e?.message || 'Failed to load documents'); }
  };

  return (
    <>
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Verification Requests
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Review and approve/reject user verification requests
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending"
          value={counts.pending.toString()}
          color="text-yellow-400"
        />
        <StatCard
          label="Under Review"
          value={counts.underReview.toString()}
          color="text-blue-400"
        />
        <StatCard label="Approved Today" value={counts.approvedToday.toString()} color="text-green-400" />
        <StatCard label="Rejected Today" value={counts.rejectedToday.toString()} color="text-red-400" />
      </div>

      {/* Verification Requests List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="divide-y divide-border">
          {items.map((request) => (
            <div
              key={request.id}
              className="hover:bg-white/5 transition-colors"
            >
              {/* Request Header */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === request.id ? null : request.id)
                }
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {request.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium">
                      {request.name}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {request.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      request.status,
                    )}`}
                  >
                    {request.status}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {request.submittedDate}
                  </span>
                  <svg
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      expandedId === request.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded Content */}
              {expandedId === request.id && (
                <div className="px-6 pb-6 border-t border-border/50 space-y-4">
                  {/* Documents Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Submitted Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {request.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg bg-white/5 border border-border/50 flex items-center justify-between"
                        >
                          <span className="text-foreground text-sm">{doc}</span>
                          {getDocStatusIcon(request.docStatus[idx])}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Document Details */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">
                      Document Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      {request.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg flex items-center justify-between ${
                            request.docStatus[idx] === "verified"
                              ? "bg-green-500/10 text-green-300"
                              : request.docStatus[idx] === "rejected"
                                ? "bg-red-500/10 text-red-300"
                                : "bg-yellow-500/10 text-yellow-300"
                          }`}
                        >
                          <span>{doc}</span>
                          <span className="text-xs capitalize">
                            {request.docStatus[idx]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {(request.status === "Pending" ||
                    request.status === "Under Review") && (
                    <div className="pt-4 flex gap-3">
                      <Button onClick={()=>approve(request.id)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button onClick={()=>viewDocs(request.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
                        View Documents
                      </Button>
                      <Button onClick={()=>reject(request.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2">
                        <X className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
    <Dialog open={viewer.open} onOpenChange={(o)=>setViewer(v=>({ ...v, open: o }))}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{viewer.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {viewer.docs.length === 0 && <div className="text-sm text-muted-foreground">No documents.</div>}
          {viewer.docs.map((d, i)=> (
            <div key={i} className="rounded border p-3">
              <div className="text-sm font-medium mb-2">{d.name}</div>
              {d.base64 ? (
                <a href={d.base64} target="_blank" rel="noreferrer" className="text-primary text-sm underline">Open</a>
              ) : (
                <div className="text-xs text-muted-foreground">No preview available.</div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
