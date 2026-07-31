import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { TableSkeleton } from "@/components/tables/TableSkeleton";
import { equipamentosService, queryKeys } from "@/services/queries";
import { EquipamentoForm } from "./-components/EquipamentoForm";
import { defaultEquipamentoFormValues } from "./-lib/schema";
import type { ChecklistItem } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/equipamentos/novo")({
  head: () => ({
    meta: [{ title: "Novo equipamento — BP Info Gestão" }],
  }),
  component: NovoEquipamentoPage,
});

function NovoEquipamentoPage() {
  const navigate = useNavigate();

  const { data: checklistItens, isLoading } = useQuery({
    queryKey: queryKeys.checklistItens,
    queryFn: equipamentosService.listChecklistItens,
  });

  return (
    <>
      <PageHeader
        title="Novo equipamento"
        description="Registre a entrada de um equipamento vinculado a um cliente."
      />

      <Section title="Dados do equipamento">
        {isLoading ? (
          <TableSkeleton rows={4} cols={2} />
        ) : (
          <EquipamentoForm
            defaultValues={defaultEquipamentoFormValues((checklistItens ?? []) as ChecklistItem[])}
            onCancel={() => void navigate({ to: "/equipamentos" })}
            onSaved={(equipamento) =>
              void navigate({ to: "/equipamentos/$id", params: { id: equipamento.id } })
            }
          />
        )}
      </Section>
    </>
  );
}
