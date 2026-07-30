import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Compact row used for lists of secondary information (recent items, agenda
 * events, preview rows) — the `surface-secondary` shell that used to be
 * copy-pasted as raw utility classes on every page.
 */
export function InfoCard({
  leading,
  title,
  subtitle,
  meta,
  align = "center",
  interactive = false,
  className,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  align?: "center" | "start";
  interactive?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "surface-secondary flex flex-wrap gap-3",
        align === "start" ? "items-start" : "items-center",
        interactive && "transition-colors hover:bg-muted/40",
        className,
      )}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {meta}
    </div>
  );
}
