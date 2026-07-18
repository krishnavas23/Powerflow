import { Page } from "@/components/Page";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@shared/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
// Use centralized backend base URL

type ProfileData = {
  avatar?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  bio: string;
  kyc: "unverified" | "pending" | "verified" | "rejected";
};

const KEY = "powerflow.profile";

export default function Profile(){
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<ProfileData>({ name: "", email: "", phone: "", address: "", city: "", country: "", bio: "", kyc: "unverified" });

  // Prefill with user info saved at login
  useEffect(()=>{
    try{
      const rawUser = localStorage.getItem("powerflow.user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        setData((d)=>({
          ...d,
          name: u.name || d.name,
          email: u.email || d.email,
          phone: u.phone || d.phone,
          address: u.address || d.address,
          city: u.city || d.city,
          country: u.country || d.country,
          bio: u.bio || d.bio,
          kyc: (u.kycStatus as any) || d.kyc,
        }));
      }
    } catch{}
  },[]);

  // Load cached profile immediately for better UX
  useEffect(()=>{
    try {
      const cached = localStorage.getItem(KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setData((d)=>({ ...d, ...parsed }));
      }
    } catch {}
  },[]);

  useEffect(()=>{
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const p = await res.json();
        if (res.ok) {
          const next = { ...data, name: p.name || data.name, email: p.email || data.email, phone: p.phone || data.phone, address: p.address || data.address, city: p.city || data.city, country: p.country || data.country, bio: p.bio || data.bio, kyc: (p.kycStatus as any) || data.kyc } as ProfileData;
          setData(next);
          try { localStorage.setItem("powerflow.profile", JSON.stringify(next)); } catch {}
        }
      } catch {}
    };
    load();
  },[]);

  const save = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ name: data.name, email: data.email, phone: data.phone, address: data.address, city: data.city, country: data.country, bio: data.bio })
      });
      if (!res.ok) throw new Error('Failed to save profile');
      try { localStorage.setItem("powerflow.profile", JSON.stringify(data)); localStorage.setItem("powerflow.user", JSON.stringify({ ...JSON.parse(localStorage.getItem("powerflow.user")||"{}"), ...data })); } catch {}
      toast({ title: 'Profile saved' });
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  // Compute profile completion percentage
  const completion = (() => {
    const fields = [
      data.name,
      data.email,
      data.phone,
      data.address,
      data.city,
      data.country,
      data.bio,
      data.avatar,
    ];
    const filled = fields.filter((v)=> !!(v && String(v).trim().length > 0)).length;
    const base = Math.round((filled / fields.length) * 100);
    // Add bonus if KYC pending (80) or verified (100)
    if (data.kyc === 'verified') return 100;
    return base;
  })();

  const onAvatar = async (f: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = String(reader.result);
      setData((d)=>({ ...d, avatar: base64 }));
      await fetch(`${BACKEND_BASE_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ avatarUrl: base64 })
      });
    };
    reader.readAsDataURL(f);
  };

  return (
    <Page>
      <h1 className="text-3xl font-bold">Profile</h1>

      <div className="mt-4">
        <Alert>
          <AlertTitle>Profile completion: {completion}%</AlertTitle>
          <AlertDescription>
            <div className="mt-2 flex items-center gap-3">
              <Progress value={completion} className="w-64" />
              <span className="text-xs text-muted-foreground">{completion < 100 ? 'Complete missing fields for faster KYC verification.' : 'Great! Your profile is complete.'}</span>
            </div>
          </AlertDescription>
        </Alert>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/40">
              <AvatarImage src={data.avatar} />
              <AvatarFallback>{data.name?.slice(0,2).toUpperCase() || "PF"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold">{data.name || "Your name"}</div>
              <div className="text-xs text-muted-foreground">KYC: <span className={data.kyc === 'verified' ? 'text-green-400' : data.kyc === 'pending' ? 'text-yellow-400' : 'text-muted-foreground'}>{data.kyc}</span></div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={()=>fileRef.current?.click()} variant="secondary">Upload Avatar</Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f = e.target.files?.[0]; if(f) onAvatar(f); }} />
            <Button variant="outline" onClick={()=>setData(d=>({ ...d, avatar: undefined }))}>Remove</Button>
          </div>
          <Separator className="my-4" />
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div>Email: {data.email || "—"}</div>
            <div>Phone: {data.phone || "—"}</div>
            <div>City: {data.city || "—"}</div>
            <div>Country: {data.country || "—"}</div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border bg-card/60 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">Personal Information</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input placeholder="Full name" value={data.name} onChange={(e)=>setData(d=>({ ...d, name: e.target.value }))} />
            <Input placeholder="Email" value={data.email} onChange={(e)=>setData(d=>({ ...d, email: e.target.value }))} />
            <Input placeholder="Phone" value={data.phone} onChange={(e)=>setData(d=>({ ...d, phone: e.target.value }))} />
            <Input placeholder="City" value={data.city} onChange={(e)=>setData(d=>({ ...d, city: e.target.value }))} />
            <Input placeholder="Country" value={data.country} onChange={(e)=>setData(d=>({ ...d, country: e.target.value }))} />
            <div className="md:col-span-2">
              <Input placeholder="Address" value={data.address} onChange={(e)=>setData(d=>({ ...d, address: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Textarea placeholder="Short bio" value={data.bio} onChange={(e)=>setData(d=>({ ...d, bio: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={save}>Save</Button>
            <Button variant="outline" onClick={()=>setData({ name: "", email: "", phone: "", address: "", city: "", country: "", bio: "", kyc: "unverified" })}>Reset</Button>
            <KycUpload onDone={(status)=>setData(d=>({ ...d, kyc: status }))} />
          </div>
        </div>
      </div>
    </Page>
  );
}

function KycUpload({ onDone }: { onDone: (s: 'unverified'|'pending'|'verified'|'rejected')=>void }){
  const { toast } = useToast();
  // Align with backend enums in KycDocument model
  const [category, setCategory] = useState<'Individual' | 'Organization'>('Individual');
  const [docType, setDocType] = useState<'Aadhaar' | 'PAN' | 'GST' | 'Passport' | 'Other'>('Aadhaar');
  const [file, setFile] = useState<File | null>(null);
  const submit = async () => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'KYC error', description: 'File size exceeds 20 MB.', variant: 'destructive' });
      return;
    }
    // Always use JSON base64 for compatibility with backend
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = String(reader.result);
        const res = await fetch(`${BACKEND_BASE_URL}/api/profile/kyc`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ category, docType, filename: file.name, contentType: file.type, base64, size: file.size })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to upload KYC');
        toast({ title: 'KYC submitted', description: 'We will verify your documents shortly.' });
        onDone('pending');
      } catch (e: any) {
        toast({ title: 'KYC error', description: e.message || 'Failed to fetch', variant: 'destructive' });
      }
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="ml-auto flex items-center gap-2">
      <select className="h-9 border rounded bg-background" value={category} onChange={(e)=>setCategory(e.target.value as 'Individual' | 'Organization')}>
        <option value="Individual">Individual</option>
        <option value="Organization">Organization</option>
      </select>
      <select className="h-9 border rounded bg-background" value={docType} onChange={(e)=>setDocType(e.target.value as 'Aadhaar' | 'PAN' | 'GST' | 'Passport' | 'Other')}>
        <option value="Aadhaar">Aadhaar</option>
        <option value="PAN">PAN</option>
        <option value="GST">GST</option>
        <option value="Passport">Passport</option>
        <option value="Other">Other</option>
      </select>
      <input type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} className="text-xs" />
      <Button variant="secondary" onClick={submit}>Submit KYC</Button>
    </div>
  );
}
