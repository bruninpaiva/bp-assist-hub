import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { toast } from "sonner";
import { HardDrive, Plus } from "lucide-react";
import { equipamentosService, queryKeys } from "@/services/queries";
import { tipoEquipamentoLabels } from "@/lib/labels";
import type { Equipamento } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/equipamentos")({
  head: () => ({
    meta: [
      { title: "Equipamentos — BP Info Gestão" },
      {
        name: "description",
        content:
          "Cadastro de notebooks, desktops, servidores, impressoras e demais equipamentos por cliente.",
      },
      { property: "og:title", content: "Equipamentos — BP Info Gestão" },
      {
        property: "og:description",
        content:
          "Cadastro de notebooks, desktops, servidores, impressoras e demais equipamentos por cliente.",
      },
    ],
  }),
  component: EquipamentosPage,
});

type EquipamentoRow = Equipamento & { clientes?: { nome: string } | null };

const columns: DataTableColumn<EquipamentoRow>[] = [
  {
    key: "equipamento",
    header: "Equipamento",
    cell: (e) => (
      <span className="font-medium">{[e.marca, e.modelo].filter(Boolean).join(" ") || "—"}</span>
    ),
  },
  {
    key: "tipo",
    header: "Tipo",
    cell: (e) => <StatusBadge label={tipoEquipamentoLabels[e.tipo]} tone="info" />,
  },
  {
    key: "serie",
    header: "Série / Patrimônio",
    cell: (e) => <span className="font-mono text-xs">{e.numero_serie || e.patrimonio || "—"}</span>,
  },
  { key: "cliente", header: "Cliente", cell: (e) => e.clientes?.nome ?? "—" },
  {
    key: "defeito",
    header: "Defeito informado",
    cell: (e) => (
      <span className="block max-w-xs truncate text-sm text-muted-foreground">
        {e.defeito_informado || "—"}
      </span>
    ),
  },
];

function EquipamentosPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.equipamentos,
    queryFn: equipamentosService.list,
  });
  const equipamentos = (data ?? []) as EquipamentoRow[];

  return (
    <>
      <PageHeader
        title="Equipamentos"
        description="Histórico técnico de cada equipamento: série, patrimônio, defeito informado e acessórios."
        actions={
          <Button onClick={() => toast.info("Cadastro de equipamentos chega no próximo módulo.")}>
            <Plus className="size-4" /> Novo equipamento
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {Object.entries(tipoEquipamentoLabels)
          .slice(0, 5)
          .map(([key, label]) => (
            <Card key={key} className="surface-card p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-xl font-bold">
                {equipamentos.filter((e) => e.tipo === key).length}
              </p>
            </Card>
          ))}
      </div>

      <Section title="Equipamentos cadastrados">
        <DataTable
          columns={columns}
          data={equipamentos}
          isLoading={isLoading}
          getRowKey={(e) => e.id}
          emptyIcon={HardDrive}
          emptyTitle="Nenhum equipamento cadastrado"
          emptyDescription="Vincule equipamentos aos clientes para acompanhar todo o histórico de manutenções."
        />
      </Section>
    </>
  );
}
