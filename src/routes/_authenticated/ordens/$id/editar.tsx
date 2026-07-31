import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileWarning } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { TableSkeleton } from "@/components/tables/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ordensService, queryKeys } from "@/services/queries";
import type { OSComRelacoes } from "@/types/domain";
import { OrdemServicoForm } from "../-components/OrdemServicoForm";
import { ordemServicoToFormValues } from "../-lib/schema";

export const Route = createFileRoute("/_authenticated/ordens/$id/editar")({
  head: () => ({
    meta: [{ title: "Editar ordem de serviço — BP Info Gestão" }],
  }),
  component: EditarOrdemPage,
});

function EditarOrdemPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data: ordem, isLoading } = useQuery({
    queryKey: queryKeys.ordem(id),
    queryFn: () => ordensService.get(id),
  });

  return (
    <>
      <PageHeader title="Editar ordem de serviço" description="Atualize os dados da OS." />

      <Section title="Dados da ordem de serviço">
        {isLoading ? (
          <TableSkeleton rows={4} cols={2} />
        ) : !ordem ? (
          <EmptyState icon={FileWarning} title="Ordem de serviço não encontrada" />
        ) : (
          <OrdemServicoForm
            ordemId={id}
            defaultValues={ordemServicoToFormValues(ordem as OSComRelacoes)}
            onCancel={() => void navigate({ to: "/ordens/$id", params: { id } })}
            onSaved={() => void navigate({ to: "/ordens/$id", params: { id } })}
          />
        )}
      </Section>
    </>
  );
}
