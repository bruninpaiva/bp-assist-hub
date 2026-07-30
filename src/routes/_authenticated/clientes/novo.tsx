import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { ClienteForm } from "./-components/ClienteForm";

export const Route = createFileRoute("/_authenticated/clientes/novo")({
  head: () => ({
    meta: [{ title: "Novo cliente — BP Info Gestão" }],
  }),
  component: NovoClientePage,
});

function NovoClientePage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Novo cliente"
        description="Cadastre um cliente pessoa física ou jurídica."
      />

      <Section title="Dados do cliente">
        <ClienteForm
          onCancel={() => void navigate({ to: "/clientes" })}
          onSaved={(cliente) => void navigate({ to: "/clientes/$id", params: { id: cliente.id } })}
        />
      </Section>
    </>
  );
}
