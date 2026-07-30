import { useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Search, UserRound } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { iniciais } from "@/lib/format";
import { roleLabels } from "@/lib/labels";

export function Topbar() {
  const { profile, user, roles, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/80 bg-background/80 px-4 backdrop-blur-xl">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes, OS, orçamentos..."
          className="h-9 border-border/70 bg-muted/40 pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="size-4.5" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-primary" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-lg py-1.5 pr-2 pl-1.5 transition-colors hover:bg-muted/60">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary-glow">
                  {iniciais(profile?.nome ?? user?.email)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-medium">
                  {profile?.nome || user?.email?.split("@")[0]}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {roles.length ? roleLabels[roles[0]] : "Sem perfil"}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="space-y-1">
              <p className="text-sm">{profile?.nome || "Usuário"}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {roles.map((r) => (
                  <Badge key={r} variant="secondary" className="text-[10px]">
                    {roleLabels[r]}
                  </Badge>
                ))}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void navigate({ to: "/configuracoes" })}>
              <UserRound className="size-4" />
              Meu perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void handleSignOut()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
