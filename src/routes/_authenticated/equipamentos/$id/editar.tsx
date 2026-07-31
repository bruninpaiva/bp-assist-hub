import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { TableSkeleton } from "@/components/tables/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { HardDriveIcon } from "lucide-react";
import { equipamentosService, queryKeys } from "@/services/queries";
import type { ChecklistItem, EquipamentoComRelacoes } from "@/types/domain";
import { EquipamentoForm } from "../-components/EquipamentoForm";
import { equipamentoToFormValues } from "../-lib/schema";

export const Route = createFileRoute("/_authenticated/equipamentos/$id/editar")({
  head: () => ({
    meta: [{ title: "Editar equipamento — BP Info Gestão" }],
  }),
  component: EditarEquipamentoPage,
});

function EditarEquipamentoPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data: equipamento, isLoading: carregandoEquipamento } = useQuery({
    queryKey: queryKeys.equipamento(id),
    queryFn: () => equipamentosService.get(id),
  });
  const { data: checklistItens, isLoading: carregandoChecklist } = useQuery({
    queryKey: queryKeys.checklistItens,
    queryFn: equipamentosService.listChecklistItens,
  });

  const isLoading = carregandoEquipamento || carregandoChecklist;

  return (
    <>
      <PageHeader
        title="Editar equipamento"
        description="Atualize os dados técnicos do equipamento."
      />

      <Section title="Dados do equipamento">
        {isLoading ? (
          <TableSkeleton rows={4} cols={2} />
        ) : !equipamento ? (
          <EmptyState icon={HardDriveIcon} title="Equipamento não encontrado" />
        ) : (
          <EquipamentoForm
            equipamentoId={id}
            defaultValues={equipamentoToFormValues(
              equipamento as EquipamentoComRelacoes,
              (checklistItens ?? []) as ChecklistItem[],
            )}
            onCancel={() => void navigate({ to: "/equipamentos/$id", params: { id } })}
            onSaved={() => void navigate({ to: "/equipamentos/$id", params: { id } })}
          />
        )}
      </Section>
    </>
  );
}
