import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateDisplay } from "@/components/common/DateDisplay";
import { Money } from "@/components/common/Money";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { toast } from "sonner";
import { Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/cards/MetricCard";
import { financeiroService, queryKeys } from "@/services/queries";
import { statusLancamentoLabels } from "@/lib/labels";
import { brl } from "@/lib/format";
import { fluxoResumo } from "@/components/dashboard/mock-data";
import type { Lancamento } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — BP Info Gestão" },
      {
        name: "description",
        content: "Fluxo de caixa, entradas, saídas, receitas, despesas e relatórios financeiros.",
      },
      { property: "og:title", content: "Financeiro — BP Info Gestão" },
      {
        property: "og:description",
        content: "Fluxo de caixa, entradas, saídas, receitas, despesas e relatórios financeiros.",
      },
    ],
  }),
  component: FinanceiroPage,
});

const columns: DataTableColumn<Lancamento>[] = [
  {
    key: "descricao",
    header: "Descrição",
    cell: (l) => <span className="font-medium">{l.descricao}</span>,
  },
  {
    key: "tipo",
    header: "Tipo",
    cell: (l) => (
      <StatusBadge
        label={l.tipo === "entrada" ? "Entrada" : "Saída"}
        tone={l.tipo === "entrada" ? "success" : "danger"}
      />
    ),
  },
  {
    key: "vencimento",
    header: "Vencimento",
    cell: (l) => (
      <span className="text-sm text-muted-foreground">
        <DateDisplay value={l.data_vencimento} />
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (l) => <StatusBadge {...statusLancamentoLabels[l.status]} />,
  },
  {
    key: "valor",
    header: "Valor",
    className: "text-right",
    cell: (l) => (
      <span className="font-semibold">
        <Money value={l.valor} />
      </span>
    ),
  },
];

function ListaLancamentos({ tipo }: { tipo?: "entrada" | "saida" }) {
  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.lancamentos, tipo ?? "todos"],
    queryFn: () => financeiroService.list(tipo),
  });
  const lancamentos = (data ?? []) as Lancamento[];

  return (
    <DataTable
      columns={columns}
      data={lancamentos}
      isLoading={isLoading}
      getRowKey={(l) => l.id}
      emptyIcon={Wallet}
      emptyTitle="Nenhum lançamento"
      emptyDescription="Receitas e despesas lançadas aparecerão aqui com vencimento, status e categoria."
    />
  );
}

function FinanceiroPage() {
  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Fluxo de caixa, contas a receber e a pagar, com base para relatórios gerenciais."
        actions={
          <Button onClick={() => toast.info("Lançamentos financeiros chegam no próximo módulo.")}>
            <Plus className="size-4" /> Novo lançamento
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Entradas do mês" value={brl(fluxoResumo.entradas)} icon={TrendingUp} />
        <MetricCard label="Saídas do mês" value={brl(fluxoResumo.saidas)} icon={TrendingDown} />
        <MetricCard label="A receber" value={brl(fluxoResumo.aReceber)} icon={Wallet} />
        <MetricCard
          label="Saldo"
          value={brl(fluxoResumo.entradas - fluxoResumo.saidas)}
          icon={Wallet}
        />
      </div>

      <Section title="Movimentações">
        <Tabs defaultValue="fluxo">
          <TabsList>
            <TabsTrigger value="fluxo">Fluxo de caixa</TabsTrigger>
            <TabsTrigger value="entradas">Entradas</TabsTrigger>
            <TabsTrigger value="saidas">Saídas</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>
          <TabsContent value="fluxo" className="pt-4">
            <ListaLancamentos />
          </TabsContent>
          <TabsContent value="entradas" className="pt-4">
            <ListaLancamentos tipo="entrada" />
          </TabsContent>
          <TabsContent value="saidas" className="pt-4">
            <ListaLancamentos tipo="saida" />
          </TabsContent>
          <TabsContent value="relatorios" className="pt-4">
            <EmptyState
              icon={Wallet}
              title="Relatórios em construção"
              description="DRE simplificado, faturamento por período e comparativos ficarão disponíveis aqui."
            />
          </TabsContent>
        </Tabs>
      </Section>
    </>
  );
}
