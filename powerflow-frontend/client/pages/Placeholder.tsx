import { Page } from "@/components/Page";

export default function Placeholder({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <Page>
      <div className="grid gap-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur">
          <div className="text-muted-foreground">
            This page will be crafted next. Tell me exactly what you want here.
          </div>
          {children}
        </div>
      </div>
    </Page>
  );
}
