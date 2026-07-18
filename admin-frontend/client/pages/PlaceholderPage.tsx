import { AlertCircle } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        )}
      </div>

      <div className="flex items-center justify-center min-h-96 bg-card border border-border rounded-lg">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Page Under Development
          </h3>
          <p className="text-muted-foreground max-w-xs">
            This page is being built. Continue prompting to fill in the content
            you need for this section.
          </p>
        </div>
      </div>
    </div>
  );
}
