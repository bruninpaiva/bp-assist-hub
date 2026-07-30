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
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { MetricCard } from "@/components/cards/MetricCard";
import { InfoCard } from "@/components/cards/InfoCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Money } from "@/components/common/Money";
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

const caixaResumo = [
  { label: "Entradas", value: fluxoResumo.entradas, tone: "text-success" },
  { label: "Saídas", value: fluxoResumo.saidas, tone: "text-destructive" },
  { label: "A receber", value: fluxoResumo.aReceber, tone: "text-info" },
  { label: "A pagar", value: fluxoResumo.aPagar, tone: "text-warning" },
];

const proximosCompromissos = [
  { hora: "09:00", titulo: "Visita técnica — Clínica São Lucas", tipo: "Visita" },
  { hora: "13:30", titulo: "Retirada de notebook — Marcos P.", tipo: "Retirada" },
  { hora: "16:00", titulo: "Entrega de servidor — OdontoMega", tipo: "Entrega" },
];

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
        <MetricCard label="OS em aberto" value="18" icon={Wrench} trend={12} hint="4 urgentes" />
        <MetricCard
          label="Orçamentos enviados"
          value="9"
          icon={FileText}
          trend={-4}
          hint="Aguardando aprovação"
        />
        <MetricCard label="Clientes ativos" value="126" icon={Users} trend={6} hint="+7 no mês" />
        <MetricCard
          label="Receita do mês"
          value={brl(fluxoResumo.entradas)}
          icon={TrendingUp}
          trend={16}
          hint="Meta: R$ 26.000"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section
          className="lg:col-span-2"
          title="Fluxo financeiro"
          description="Receitas x despesas dos últimos meses"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/financeiro">
                Detalhes <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
          contentClassName="h-72 pr-2"
        >
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
        </Section>

        <Section title="Resumo do caixa" description="Mês corrente" contentClassName="space-y-3">
          {caixaResumo.map((row) => (
            <div key={row.label} className="surface-secondary flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className={`font-semibold ${row.tone}`}>
                <Money value={row.value} />
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-3">
            <span className="text-sm font-medium">Saldo do período</span>
            <span className="font-bold text-primary-glow">
              <Money value={fluxoResumo.entradas - fluxoResumo.saidas} />
            </span>
          </div>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section
          className="lg:col-span-2"
          title="Últimas ordens de serviço"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/ordens">
                Ver todas <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
          contentClassName="space-y-2"
        >
          {ultimasOS.map((os) => (
            <InfoCard
              key={os.numero}
              interactive
              leading={
                <span className="font-mono text-xs text-muted-foreground">
                  #{String(os.numero).padStart(4, "0")}
                </span>
              }
              title={os.cliente}
              subtitle={os.equipamento}
              meta={
                <>
                  <StatusBadge {...prioridadeLabels[os.prioridade]} />
                  <StatusBadge {...statusOSLabels[os.status]} />
                  <span className="w-24 text-right text-sm font-semibold">
                    <Money value={os.valor} />
                  </span>
                </>
              }
            />
          ))}
        </Section>

        <Section title="OS por tipo de equipamento" contentClassName="h-64">
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
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section
          className="lg:col-span-2"
          title="Últimos orçamentos"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/orcamentos">
                Ver todos <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
          contentClassName="space-y-2"
        >
          {ultimosOrcamentos.map((orc) => (
            <InfoCard
              key={orc.numero}
              leading={
                <span className="font-mono text-xs text-muted-foreground">
                  Nº {orc.numero}/2023
                </span>
              }
              title={orc.cliente}
              meta={
                <>
                  <StatusBadge {...statusOrcamentoLabels[orc.status]} />
                  <span className="w-28 text-right text-sm font-semibold">
                    <Money value={orc.total} />
                  </span>
                </>
              }
            />
          ))}
        </Section>

        <Section title="Próximos compromissos" contentClassName="space-y-2">
          {proximosCompromissos.map((ev) => (
            <InfoCard
              key={ev.hora}
              align="start"
              leading={<CalendarClock className="mt-0.5 size-4 shrink-0 text-primary-glow" />}
              title={ev.titulo}
              subtitle={`Hoje às ${ev.hora} · ${ev.tipo}`}
            />
          ))}
          <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
            <TrendingDown className="size-3.5" />
            Agenda demonstrativa
          </div>
        </Section>
      </div>
    </>
  );
}
