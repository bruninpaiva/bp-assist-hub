import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import { Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared/StatCard";
import { financeiroService, queryKeys } from "@/services/queries";
import { statusLancamentoLabels } from "@/lib/labels";
import { brl, dataCurta } from "@/lib/format";
import { fluxoResumo } from "@/components/dashboard/mock-data";
import type { Lancamento } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — BP Info Gestão" },
      { name: "description", content: "Fluxo de caixa, entradas, saídas, receitas, despesas e relatórios financeiros." },
      { property: "og:title", content: "Financeiro — BP Info Gestão" },
      { property: "og:description", content: "Fluxo de caixa, entradas, saídas, receitas, despesas e relatórios financeiros." },
    ],
  }),
  component: FinanceiroPage,
});

function ListaLancamentos({ tipo }: { tipo?: "entrada" | "saida" }) {
  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.lancamentos, tipo ?? "todos"],
    queryFn: () => financeiroService.list(tipo),
  });
  const lancamentos = (data ?? []) as Lancamento[];

  if (isLoading) return <TableSkeleton cols={5} />;
  if (lancamentos.length === 0)
    return (
      <EmptyState
        icon={Wallet}
        title="Nenhum lançamento"
        description="Receitas e despesas lançadas aparecerão aqui com vencimento, status e categoria."
      />
    );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrição</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lancamentos.map((l) => (
          <TableRow key={l.id}>
            <TableCell className="font-medium">{l.descricao}</TableCell>
            <TableCell>
              <StatusBadge
                label={l.tipo === "entrada" ? "Entrada" : "Saída"}
                tone={l.tipo === "entrada" ? "success" : "danger"}
              />
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {dataCurta(l.data_vencimento)}
            </TableCell>
            <TableCell>
              <StatusBadge {...statusLancamentoLabels[l.status]} />
            </TableCell>
            <TableCell className="text-right font-semibold">{brl(l.valor)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
        <StatCard label="Entradas do mês" value={brl(fluxoResumo.entradas)} icon={TrendingUp} />
        <StatCard label="Saídas do mês" value={brl(fluxoResumo.saidas)} icon={TrendingDown} />
        <StatCard label="A receber" value={brl(fluxoResumo.aReceber)} icon={Wallet} />
        <StatCard
          label="Saldo"
          value={brl(fluxoResumo.entradas - fluxoResumo.saidas)}
          icon={Wallet}
        />
      </div>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-base">Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </>
  );
}
