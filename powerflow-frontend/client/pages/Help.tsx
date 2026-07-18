import { Page } from "@/components/Page";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { BACKEND_BASE_URL } from "@shared/api";

export default function Help(){
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<{ _id?: string; question: string; answer: string }[]>([]);

  const defaultFaqs: { question: string; answer: string }[] = [
    {
      question: "How do I add funds to my wallet?",
      answer: "Go to Add Funds and complete checkout. On success, the wallet balance updates after Stripe webhook confirms the payment.",
    },
    {
      question: "How do I upload surplus energy?",
      answer: "Use Upload Energy. Producers can list available kWh with a demand price. Energy is pooled and your wallet receives equivalent Energy Credits.",
    },
    {
      question: "Where can I buy energy?",
      answer: "Open Buy Energy to see available listings. Enter kWh to purchase and confirm. Your INR is deducted and Energy Credits increase.",
    },
    {
      question: "Why don’t I see new listings after upload?",
      answer: "Listings refresh automatically. If not, refresh the page; ensure you’re logged in as Producer and the backend is reachable.",
    },
    {
      question: "Is my profile saved?",
      answer: "Yes. Profile changes are saved to the backend and cached locally so they persist across reloads.",
    },
  ];

  useEffect(()=>{
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/help/faq`);
        if (!res.ok) throw new Error("fallback");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFaqs(data);
        } else {
          setFaqs(defaultFaqs);
        }
      } catch {
        setFaqs(defaultFaqs);
      }
    };
    load();
  },[]);
  return (
    <Page>
      <h1 className="text-3xl font-bold">Help & Support</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border bg-card/60 p-6 backdrop-blur lg:col-span-2">
          <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="mt-4">
            {faqs.map((f, i)=> (
              <AccordionItem key={f._id || i} value={`q${i}`}>
                <AccordionTrigger>{f.question}</AccordionTrigger>
                <AccordionContent>{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="rounded-2xl border bg-card/60 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">Contact us</h2>
          <p className="mt-1 text-sm text-muted-foreground">Provide your message and we’ll get back soon.</p>
          <form className="mt-4 grid gap-3" onSubmit={async (e)=>{ 
            e.preventDefault(); 
            const form = e.target as HTMLFormElement;
            const fd = new FormData(form);
            const payload = { name: String(fd.get('name')||''), email: String(fd.get('email')||''), message: String(fd.get('message')||'') };
            try {
              const res = await fetch(`${BACKEND_BASE_URL}/api/help/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(payload) });
              const data = await res.json();
              if (!res.ok) throw new Error(data.message || 'Failed to send');
              toast({ title: 'Message sent', description: 'We will reach out to your email shortly.' });
              form.reset();
            } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
          }}>
            <Input name="name" placeholder="Your name" required />
            <Input name="email" type="email" placeholder="Email" required />
            <Textarea name="message" placeholder="How can we help?" required />
            <Button type="submit">Send message</Button>
          </form>
          <div className="mt-4 text-xs text-muted-foreground">Prefer email/phone in footer? Share details and we’ll add them.</div>
        </section>

        {null}
      </div>
    </Page>
  );
}
