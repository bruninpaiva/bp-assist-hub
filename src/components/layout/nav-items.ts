import {
  CalendarDays,
  FileText,
  HardDrive,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Visão geral",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Operação",
    items: [
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Equipamentos", url: "/equipamentos", icon: HardDrive },
      { title: "Ordens de Serviço", url: "/ordens", icon: Wrench },
      { title: "Orçamentos", url: "/orcamentos", icon: FileText },
      { title: "Agenda", url: "/agenda", icon: CalendarDays },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Financeiro", url: "/financeiro", icon: Wallet },
      { title: "Estoque", url: "/estoque", icon: Package },
    ],
  },
  {
    label: "Sistema",
    items: [{ title: "Configurações", url: "/configuracoes", icon: Settings }],
  },
];
