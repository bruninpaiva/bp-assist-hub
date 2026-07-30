import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { brl } from "@/lib/format";
import { prioridadeLabels, statusOSLabels, statusOrcamentoLabels } from "@/lib/labels";
import {
  faturamentoMensal,
  fluxoResumo,
  osPorTipo,
  ultimasOS,
  ultimosOrcamentos,
} from "@/components/dashboard/mock-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BP Info Gestão" },
      {
        name: "description",
        content: "Indicadores da operação: ordens de serviço, orçamentos e fluxo financeiro.",
      },
      { property: "og:title", content: "Dashboard — BP Info Gestão" },
      { property: "og:description", content: "Indicadores da operação da BP Info." },
    ],
  }),
  component: DashboardPage,
});

const chartTooltip = {
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "var(--color-popover-foreground)",
  },
  labelStyle: { color: "var(--color-muted-foreground)" },
};

function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Panorama da operação da BP Info — dados demonstrativos nesta versão."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/orcamentos">Novo orçamento</Link>
            </Button>
            <Button asChild>
              <Link to="/ordens">Abrir OS</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="OS em aberto" value="18" icon={Wrench} trend={12} hint="4 urgentes" />
        <StatCard
          label="Orçamentos enviados"
          value="9"
          icon={FileText}
          trend={-4}
          hint="Aguardando aprovação"
        />
        <StatCard label="Clientes ativos" value="126" icon={Users} trend={6} hint="+7 no mês" />
        <StatCard
          label="Receita do mês"
          value={brl(fluxoResumo.entradas)}
          icon={TrendingUp}
          trend={16}
          hint="Meta: R$ 26.000"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="surface-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Fluxo financeiro</CardTitle>
              <p className="text-xs text-muted-foreground">Receitas x despesas dos últimos meses</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/financeiro">
                Detalhes <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="h-72 pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={faturamentoMensal}>
                <defs>
                  <linearGradient id="gReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="mes"
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${Number(v) / 1000}k`}
                />
                <Tooltip
                  {...chartTooltip}
                  formatter={(value: number | string) => brl(Number(value))}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#gReceita)"
                  name="Receita"
                />
                <Area
                  type="monotone"
                  dataKey="despesa"
                  stroke="var(--color-chart-4)"
                  strokeWidth={2}
                  fill="url(#gDespesa)"
                  name="Despesa"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="text-base">Resumo do caixa</CardTitle>
            <p className="text-xs text-muted-foreground">Mês corrente</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Entradas", value: fluxoResumo.entradas, tone: "text-success" },
              { label: "Saídas", value: fluxoResumo.saidas, tone: "text-destructive" },
              { label: "A receber", value: fluxoResumo.aReceber, tone: "text-info" },
              { label: "A pagar", value: fluxoResumo.aPagar, tone: "text-warning" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/25 px-3.5 py-3"
              >
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className={`font-semibold ${row.tone}`}>{brl(row.value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-3">
              <span className="text-sm font-medium">Saldo do período</span>
              <span className="font-bold text-primary-glow">
                {brl(fluxoResumo.entradas - fluxoResumo.saidas)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="surface-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimas ordens de serviço</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/ordens">
                Ver todas <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {ultimasOS.map((os) => (
              <div
                key={os.numero}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-muted/20 px-3.5 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  #{String(os.numero).padStart(4, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{os.cliente}</p>
                  <p className="truncate text-xs text-muted-foreground">{os.equipamento}</p>
                </div>
                <StatusBadge {...prioridadeLabels[os.prioridade]} />
                <StatusBadge {...statusOSLabels[os.status]} />
                <span className="w-24 text-right text-sm font-semibold">{brl(os.valor)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="text-base">OS por tipo de equipamento</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={osPorTipo} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="var(--color-border)"
                  horizontal={false}
                />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="tipo"
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={78}
                />
                <Tooltip {...chartTooltip} cursor={{ fill: "var(--color-muted)" }} />
                <Bar
                  dataKey="total"
                  fill="var(--color-chart-1)"
                  radius={[0, 6, 6, 0]}
                  name="Ordens"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="surface-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimos orçamentos</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/orcamentos">
                Ver todos <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {ultimosOrcamentos.map((orc) => (
              <div
                key={orc.numero}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-muted/20 px-3.5 py-3"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  Nº {orc.numero}/2023
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{orc.cliente}</p>
                <StatusBadge {...statusOrcamentoLabels[orc.status]} />
                <span className="w-28 text-right text-sm font-semibold">{brl(orc.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="text-base">Próximos compromissos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { hora: "09:00", titulo: "Visita técnica — Clínica São Lucas", tipo: "Visita" },
              { hora: "13:30", titulo: "Retirada de notebook — Marcos P.", tipo: "Retirada" },
              { hora: "16:00", titulo: "Entrega de servidor — OdontoMega", tipo: "Entrega" },
            ].map((ev) => (
              <div
                key={ev.hora}
                className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/20 px-3.5 py-3"
              >
                <CalendarClock className="mt-0.5 size-4 text-primary-glow" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{ev.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    Hoje às {ev.hora} · {ev.tipo}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <TrendingDown className="size-3.5" />
              Agenda demonstrativa
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}