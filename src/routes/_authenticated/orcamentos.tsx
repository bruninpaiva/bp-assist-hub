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
import { FileDown, FileText, Plus } from "lucide-react";
import { orcamentosService, queryKeys } from "@/services/queries";
import { statusOrcamentoLabels } from "@/lib/labels";
import { brl, dataCurta } from "@/lib/format";
import { ultimosOrcamentos } from "@/components/dashboard/mock-data";
import type { Orcamento } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/orcamentos")({
  head: () => ({
    meta: [
      { title: "Orçamentos — BP Info Gestão" },
      { name: "description", content: "Criação, envio e acompanhamento de orçamentos, preparados para geração de PDF." },
      { property: "og:title", content: "Orçamentos — BP Info Gestão" },
      { property: "og:description", content: "Criação, envio e acompanhamento de orçamentos, preparados para geração de PDF." },
    ],
  }),
  component: OrcamentosPage,
});

type OrcRow = Orcamento & { clientes?: { nome: string } | null };

function OrcamentosPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.orcamentos,
    queryFn: orcamentosService.list,
  });
  const orcamentos = (data ?? []) as OrcRow[];

  return (
    <>
      <PageHeader
        title="Orçamentos"
        description="Modelo baseado no orçamento oficial da BP Info, pronto para PDF e aprovação online."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.info("Geração de PDF será habilitada em breve.")}>
              <FileDown className="size-4" /> Exportar PDF
            </Button>
            <Button onClick={() => toast.info("Cadastro de orçamentos chega no próximo módulo.")}>
              <Plus className="size-4" /> Novo orçamento
            </Button>
          </>
        }
      />

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-base">Orçamentos emitidos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton cols={5} />
          ) : orcamentos.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhum orçamento emitido"
              description="A numeração continua a partir do nº 67/2023, seguindo o histórico da empresa."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orcamentos.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">
                      {o.numero}/{o.ano}
                    </TableCell>
                    <TableCell className="font-medium">{o.clientes?.nome ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dataCurta(o.data_emissao)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge {...statusOrcamentoLabels[o.status]} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">{brl(o.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-base">Pré-visualização do modelo (demonstração)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ultimosOrcamentos.map((o) => (
            <div
              key={o.numero}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-muted/20 px-3.5 py-3"
            >
              <span className="font-mono text-xs text-muted-foreground">Nº {o.numero}/2023</span>
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{o.cliente}</p>
              <StatusBadge {...statusOrcamentoLabels[o.status]} />
              <span className="w-28 text-right text-sm font-semibold">{brl(o.total)}</span>
            </div>
          ))}
          <p className="pt-2 text-xs text-muted-foreground">
            Validade padrão de 15 dias · Valores em Reais (R$) · BP Info — CNPJ 27.592.687/0001-58
          </p>
        </CardContent>
      </Card>
    </>
  );
}
