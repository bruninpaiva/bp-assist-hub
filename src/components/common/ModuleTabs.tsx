import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function ModuleTabs({ items }: { items: { to: string; label: string }[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card/60 p-1">
      {items.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary/15 text-primary-glow"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
