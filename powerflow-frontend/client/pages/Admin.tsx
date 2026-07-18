import { Page } from "@/components/Page";

export default function Admin() {
  return (
    <Page>
      <section className="grid gap-6">
        <h1 className="text-3xl font-bold">Admin Console</h1>
        <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur">
          <p className="text-muted-foreground">
            Restricted area. Connect real auth to manage roles, energy listings,
            settlements, and system health.
          </p>
        </div>
      </section>
    </Page>
  );
}
