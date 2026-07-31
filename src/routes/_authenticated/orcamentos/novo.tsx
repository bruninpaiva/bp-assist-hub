import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { OrcamentoForm } from "./-components/OrcamentoForm";
import { defaultOrcamentoFormValues } from "./-lib/schema";

export const Route = createFileRoute("/_authenticated/orcamentos/novo")({
  head: () => ({
    meta: [{ title: "Novo orçamento — BP Info Gestão" }],
  }),
  component: NovoOrcamentoPage,
});

function NovoOrcamentoPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Novo orçamento"
        description="Vincule o orçamento a uma ordem de serviço e adicione os itens propostos."
      />

      <Section title="Dados do orçamento">
        <OrcamentoForm
          defaultValues={defaultOrcamentoFormValues}
          onCancel={() => void navigate({ to: "/orcamentos" })}
          onSaved={(orcamento) =>
            void navigate({ to: "/orcamentos/$id", params: { id: orcamento.id } })
          }
        />
      </Section>
    </>
  );
}
