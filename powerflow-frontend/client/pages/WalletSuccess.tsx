import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { BACKEND_BASE_URL } from '@shared/api';

export default function WalletSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id') || '';
  const [tx, setTx] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const receiptUrl = useMemo(() => {
    if (!sessionId) return '';
    return `${BACKEND_BASE_URL}/api/payments/receipt/session/${encodeURIComponent(sessionId)}.pdf`;
  }, [sessionId]);

  useEffect(() => {
    const load = async () => {
      if (!sessionId) return;
      try {
        // Reconcile to ensure wallet is credited even if webhook is delayed
        try {
          await fetch(`${BACKEND_BASE_URL}/api/stripe/reconcile/${encodeURIComponent(sessionId)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch {}

        const res = await fetch(`${BACKEND_BASE_URL}/api/payments/tx/session/${encodeURIComponent(sessionId)}`, {
          // public endpoint; no auth needed
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Could not load transaction');
        const data = await res.json();
        setTx(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load payment details');
      }
    };
    load();
  }, [sessionId]);

  return (
    <Page>
      <div className="max-w-2xl mx-auto rounded-2xl border bg-card/60 p-6 backdrop-blur">
        <h1 className="text-3xl font-bold text-primary">Payment Successful</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your wallet has been credited. A confirmation email has been sent from Powerflow Support.
        </p>

        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-100 border border-red-300 p-3 rounded-lg">{error}</div>
        )}

        <div className="mt-6 grid gap-2 text-sm">
          <Row k="Stripe Session" v={sessionId || 'Unknown'} />
          <Row k="Amount" v={tx ? `₹${Number(tx.totalAmount || 0).toLocaleString()}` : '—'} />
          <Row k="Status" v={tx?.status || 'PROCESSING'} />
          <Row k="Date" v={tx?.createdAt ? new Date(tx.createdAt).toLocaleString() : new Date().toLocaleString()} />
        </div>

        <div className="mt-6 flex gap-3">
          {receiptUrl && (
            <a href={receiptUrl} target="_blank" rel="noreferrer">
              <Button>Download Receipt (PDF)</Button>
            </a>
          )}
          <Link to="/wallet">
            <Button variant="secondary">Go to Wallet</Button>
          </Link>
          <Link to="/">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </Page>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}


