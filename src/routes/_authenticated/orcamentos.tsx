import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateDisplay } from "@/components/common/DateDisplay";
import { Money } from "@/components/common/Money";
import { InfoCard } from "@/components/cards/InfoCard";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { toast } from "sonner";
import { FileDown, FileText, Plus } from "lucide-react";
import { orcamentosService, queryKeys } from "@/services/queries";
import { statusOrcamentoLabels } from "@/lib/labels";
import { ultimosOrcamentos } from "@/components/dashboard/mock-data";
import type { Orcamento } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/orcamentos")({
  head: () => ({
    meta: [
      { title: "Orçamentos — BP Info Gestão" },
      {
        name: "description",
        content: "Criação, envio e acompanhamento de orçamentos, preparados para geração de PDF.",
      },
      { property: "og:title", content: "Orçamentos — BP Info Gestão" },
      {
        property: "og:description",
        content: "Criação, envio e acompanhamento de orçamentos, preparados para geração de PDF.",
      },
    ],
  }),
  component: OrcamentosPage,
});

type OrcRow = Orcamento & { clientes?: { nome: string } | null };

const columns: DataTableColumn<OrcRow>[] = [
  {
    key: "numero",
    header: "Número",
    cell: (o) => (
      <span className="font-mono text-xs">
        {o.numero}/{o.ano}
      </span>
    ),
  },
  {
    key: "cliente",
    header: "Cliente",
    cell: (o) => <span className="font-medium">{o.clientes?.nome ?? "—"}</span>,
  },
  {
    key: "emissao",
    header: "Emissão",
    cell: (o) => (
      <span className="text-sm text-muted-foreground">
        <DateDisplay value={o.data_emissao} />
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (o) => <StatusBadge {...statusOrcamentoLabels[o.status]} />,
  },
  {
    key: "total",
    header: "Total",
    className: "text-right",
    cell: (o) => (
      <span className="font-semibold">
        <Money value={o.total} />
      </span>
    ),
  },
];

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
            <Button
              variant="outline"
              onClick={() => toast.info("Geração de PDF será habilitada em breve.")}
            >
              <FileDown className="size-4" /> Exportar PDF
            </Button>
            <Button onClick={() => toast.info("Cadastro de orçamentos chega no próximo módulo.")}>
              <Plus className="size-4" /> Novo orçamento
            </Button>
          </>
        }
      />

      <Section title="Orçamentos emitidos">
        <DataTable
          columns={columns}
          data={orcamentos}
          isLoading={isLoading}
          getRowKey={(o) => o.id}
          emptyIcon={FileText}
          emptyTitle="Nenhum orçamento emitido"
          emptyDescription="A numeração continua a partir do nº 67/2023, seguindo o histórico da empresa."
        />
      </Section>

      <Section title="Pré-visualização do modelo (demonstração)" contentClassName="space-y-2">
        {ultimosOrcamentos.map((o) => (
          <InfoCard
            key={o.numero}
            leading={
              <span className="font-mono text-xs text-muted-foreground">Nº {o.numero}/2023</span>
            }
            title={o.cliente}
            meta={
              <>
                <StatusBadge {...statusOrcamentoLabels[o.status]} />
                <span className="w-28 text-right text-sm font-semibold">
                  <Money value={o.total} />
                </span>
              </>
            }
          />
        ))}
        <p className="pt-2 text-xs text-muted-foreground">
          Validade padrão de 15 dias · Valores em Reais (R$) · BP Info — CNPJ 27.592.687/0001-58
        </p>
      </Section>
    </>
  );
}
