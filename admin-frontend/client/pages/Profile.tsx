import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Profile() {
	const [data, setData] = useState({ name: "", email: "", role: "", accountType: "" });
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const BACKEND = (typeof window !== 'undefined' && (window as any).__POWERFLOW_API__) || (import.meta as any).env?.VITE_BACKEND_BASE_URL || 'http://localhost:4000';

	const load = async () => {
		const token = localStorage.getItem('powerflow.token') || '';
		if (!token) {
			setError('No authentication token found');
			return;
		}
		try {
			setError(null);
			setLoading(true);
			const res = await fetch(`${BACKEND}/api/admin/profile`, { 
				headers: { 
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}, 
				cache: 'no-store' 
			});
			
			if (!res.ok) {
				const j = await res.json().catch(() => ({}));
				throw new Error(j?.message || j?.error || `Failed to load profile (${res.status})`);
			}
			
			const j = await res.json();
			setData({ 
				name: j?.user?.name || j?.name || '', 
				email: j?.user?.email || j?.email || '', 
				role: 'Admin',
				accountType: j?.user?.accountType || j?.accountType || '' 
			});
		} catch (e: any) { 
			setError(e?.message || 'Failed to load profile');
			console.error('Profile load error:', e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

// Save functionality removed per requirement (read-only admin profile)

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-foreground">Profile</h2>
				<p className="text-muted-foreground text-sm mt-1">Manage your admin profile</p>
			</div>
			{error && !/access denied/i.test(error) && (
				<div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
					{error}
				</div>
			)}
			{success && (
				<div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-300">
					{success}
				</div>
			)}
			{loading && !data.name && (
				<div className="text-muted-foreground text-sm">Loading profile...</div>
			)}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">Name</label>
					<Input 
						value={data.name} 
						onChange={(e)=>setData({ ...data, name: e.target.value })} 
						className="bg-white/5 border-border"
						disabled={loading}
					/>
				</div>
				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">Email</label>
					<Input 
						type="email" 
						value={data.email} 
						onChange={(e)=>setData({ ...data, email: e.target.value })} 
						className="bg-white/5 border-border"
						disabled={loading}
					/>
				</div>
				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">Role</label>
					<Input 
						value={data.role} 
						disabled 
						className="bg-white/5 border-border" 
					/>
				</div>
				<div className="space-y-2">
					<label className="text-sm font-medium text-foreground">Account Type</label>
					<Input 
						value={data.accountType} 
						disabled 
						className="bg-white/5 border-border" 
					/>
				</div>
			</div>
			{/* Save action removed - page is read-only for admins */}
		</div>
	);
}
