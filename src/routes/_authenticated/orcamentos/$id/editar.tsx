import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileWarning } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { TableSkeleton } from "@/components/tables/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { orcamentosService, queryKeys } from "@/services/queries";
import type { OrcamentoComRelacoes } from "@/types/domain";
import { OrcamentoForm } from "../-components/OrcamentoForm";
import { orcamentoToFormValues } from "../-lib/schema";

export const Route = createFileRoute("/_authenticated/orcamentos/$id/editar")({
  head: () => ({
    meta: [{ title: "Editar orçamento — BP Info Gestão" }],
  }),
  component: EditarOrcamentoPage,
});

function EditarOrcamentoPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data: orcamento, isLoading } = useQuery({
    queryKey: queryKeys.orcamento(id),
    queryFn: () => orcamentosService.get(id),
  });

  return (
    <>
      <PageHeader
        title="Editar orçamento"
        description="Atualize os dados e os itens do orçamento."
      />

      <Section title="Dados do orçamento">
        {isLoading ? (
          <TableSkeleton rows={4} cols={2} />
        ) : !orcamento ? (
          <EmptyState icon={FileWarning} title="Orçamento não encontrado" />
        ) : (
          <OrcamentoForm
            orcamentoId={id}
            defaultValues={orcamentoToFormValues(orcamento as OrcamentoComRelacoes)}
            onCancel={() => void navigate({ to: "/orcamentos/$id", params: { id } })}
            onSaved={() => void navigate({ to: "/orcamentos/$id", params: { id } })}
          />
        )}
      </Section>
    </>
  );
}
