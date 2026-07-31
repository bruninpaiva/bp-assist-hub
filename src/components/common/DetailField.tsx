import type { ReactNode } from "react";

export function DetailField({ label, value }: { label: string; value?: ReactNode }) {
  const vazio = value === undefined || value === null || value === "";
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{vazio ? "—" : value}</p>
    </div>
  );
}
