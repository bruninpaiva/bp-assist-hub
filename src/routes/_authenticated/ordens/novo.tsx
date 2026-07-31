import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { OrdemServicoForm } from "./-components/OrdemServicoForm";
import { defaultOrdemServicoFormValues } from "./-lib/schema";

export const Route = createFileRoute("/_authenticated/ordens/novo")({
  head: () => ({
    meta: [{ title: "Nova ordem de serviço — BP Info Gestão" }],
  }),
  component: NovaOrdemPage,
});

function NovaOrdemPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Nova ordem de serviço"
        description="Abra uma OS vinculada a um cliente e ao equipamento em atendimento."
      />

      <Section title="Dados da ordem de serviço">
        <OrdemServicoForm
          defaultValues={defaultOrdemServicoFormValues}
          onCancel={() => void navigate({ to: "/ordens" })}
          onSaved={(ordem) => void navigate({ to: "/ordens/$id", params: { id: ordem.id } })}
        />
      </Section>
    </>
  );
}
