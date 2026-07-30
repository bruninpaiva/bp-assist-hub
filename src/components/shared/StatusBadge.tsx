import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "primary";

const tones: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-info/12 text-info border-info/30",
  success: "bg-success/12 text-success border-success/30",
  warning: "bg-warning/12 text-warning border-warning/30",
  danger: "bg-destructive/12 text-destructive border-destructive/30",
  primary: "bg-primary/14 text-primary-glow border-primary/35",
};

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}