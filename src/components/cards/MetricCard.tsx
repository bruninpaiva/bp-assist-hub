import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  loading,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  hint?: string;
  loading?: boolean;
}) {
  const positive = (trend ?? 0) >= 0;

  return (
    <Card className="surface-card relative gap-0 overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-32 bg-[var(--gradient-glow)] opacity-70" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          )}
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/12 text-primary-glow">
          <Icon className="size-5" />
        </span>
      </div>
      {trend !== undefined && !loading ? (
        <div
          className={cn(
            "relative mt-4 inline-flex items-center gap-1 text-xs font-medium",
            positive ? "text-success" : "text-destructive",
          )}
        >
          {positive ? (
            <ArrowUpRight className="size-3.5" />
          ) : (
            <ArrowDownRight className="size-3.5" />
          )}
          {Math.abs(trend)}% vs. mês anterior
        </div>
      ) : null}
    </Card>
  );
}
