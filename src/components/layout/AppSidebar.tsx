import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/bp-info-logo.png";
import { navGroups } from "./nav-items";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === url : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border/70 px-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
            <img src={logo} alt="Logo BP Info" width={28} height={28} className="size-full object-contain" />
          </div>
          {!collapsed ? (
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">BP Info</p>
              <p className="text-[11px] text-muted-foreground">Gestão · Assistência TI</p>
            </div>
          ) : null}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1.5">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed ? (
              <SidebarGroupLabel className="text-[11px] tracking-widest uppercase">
                {group.label}
              </SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          "h-10 rounded-lg transition-colors",
                          active &&
                            "bg-primary/14 font-medium text-primary-glow hover:bg-primary/18",
                        )}
                      >
                        <Link to={item.url}>
                          <item.icon className="size-4.5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 p-3">
        {!collapsed ? (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            BP Info Gestão · v0.1
            <br />
            Ribeirão Preto — SP
          </p>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}