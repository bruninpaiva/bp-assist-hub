import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { TableSkeleton } from "@/components/tables/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { UserX } from "lucide-react";
import { clientesService, queryKeys } from "@/services/queries";
import type { ClienteComRelacoes } from "@/types/domain";
import { ClienteForm } from "../-components/ClienteForm";
import { clienteToFormValues } from "../-lib/schema";

export const Route = createFileRoute("/_authenticated/clientes/$id/editar")({
  head: () => ({
    meta: [{ title: "Editar cliente — BP Info Gestão" }],
  }),
  component: EditarClientePage,
});

function EditarClientePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data: cliente, isLoading } = useQuery({
    queryKey: queryKeys.cliente(id),
    queryFn: () => clientesService.get(id),
  });

  return (
    <>
      <PageHeader title="Editar cliente" description="Atualize os dados cadastrais do cliente." />

      <Section title="Dados do cliente">
        {isLoading ? (
          <TableSkeleton rows={4} cols={2} />
        ) : !cliente ? (
          <EmptyState icon={UserX} title="Cliente não encontrado" />
        ) : (
          <ClienteForm
            clienteId={id}
            defaultValues={clienteToFormValues(cliente as ClienteComRelacoes)}
            onCancel={() => void navigate({ to: "/clientes/$id", params: { id } })}
            onSaved={() => void navigate({ to: "/clientes/$id", params: { id } })}
          />
        )}
      </Section>
    </>
  );
}
