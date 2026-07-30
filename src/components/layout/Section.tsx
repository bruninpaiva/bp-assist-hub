import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Standard "surface-card with header + content" shell used by every page
 * section in the app (previously each page re-implemented this by hand).
 */
export function Section({
  title,
  description,
  actions,
  className,
  headerClassName,
  contentClassName,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  const hasHeader = Boolean(title || actions);

  return (
    <Card className={cn("surface-card", className)}>
      {hasHeader ? (
        <CardHeader
          className={cn(
            actions && "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
            headerClassName,
          )}
        >
          {title ? (
            <div className="space-y-1">
              <CardTitle className="text-base">{title}</CardTitle>
              {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
            </div>
          ) : null}
          {actions}
        </CardHeader>
      ) : null}
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
