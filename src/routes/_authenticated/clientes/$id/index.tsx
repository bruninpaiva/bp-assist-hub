import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pencil, UserX, Wrench, FileText, Receipt, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { TableSkeleton } from "@/components/tables/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateDisplay } from "@/components/common/DateDisplay";
import { clientesService, queryKeys } from "@/services/queries";
import { tipoPessoaLabels } from "@/lib/labels";
import { maskDocumento, maskTelefone, maskCEP } from "@/lib/masks";
import type { ClienteComRelacoes } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/clientes/$id/")({
  head: () => ({
    meta: [{ title: "Cliente — BP Info Gestão" }],
  }),
  component: ClienteDetalhePage,
});

function Campo({ label, value }: { label: string; value?: ReactNode }) {
  const vazio = value === undefined || value === null || value === "";
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{vazio ? "—" : value}</p>
    </div>
  );
}

function ClienteDetalhePage() {
  const { id } = Route.useParams();

  const { data: cliente, isLoading } = useQuery({
    queryKey: queryKeys.cliente(id),
    queryFn: () => clientesService.get(id),
  });

  if (isLoading) {
    return (
      <Section title="Carregando cliente...">
        <TableSkeleton rows={4} cols={2} />
      </Section>
    );
  }

  if (!cliente) {
    return (
      <Section title="Cliente">
        <EmptyState
          icon={UserX}
          title="Cliente não encontrado"
          description="Ele pode ter sido excluído."
        />
      </Section>
    );
  }

  const c = cliente as ClienteComRelacoes;
  const endereco = [c.endereco, c.numero].filter(Boolean).join(", ");
  const cidadeUf = [c.cidade, c.uf].filter(Boolean).join(" / ");

  return (
    <>
      <PageHeader
        title={c.nome}
        description={tipoPessoaLabels[c.tipo_pessoa]}
        actions={
          <>
            <StatusBadge
              label={c.ativo ? "Ativo" : "Inativo"}
              tone={c.ativo ? "success" : "neutral"}
            />
            <Button asChild>
              <Link to="/clientes/$id/editar" params={{ id: c.id }}>
                <Pencil className="size-4" /> Editar
              </Link>
            </Button>
          </>
        }
      />

      <Section title="Dados cadastrais">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.tipo_pessoa === "juridica" ? (
            <>
              <Campo label="Razão social" value={c.razao_social} />
              <Campo label="Nome fantasia" value={c.nome_fantasia} />
              <Campo label="CNPJ" value={c.cnpj ? maskDocumento(c.cnpj) : null} />
              <Campo label="Inscrição estadual" value={c.inscricao_estadual} />
            </>
          ) : (
            <Campo label="CPF" value={c.cpf ? maskDocumento(c.cpf) : null} />
          )}
          <Campo label="E-mail" value={c.email} />
          <Campo label="Telefone" value={c.telefone ? maskTelefone(c.telefone) : null} />
          <Campo label="WhatsApp" value={c.whatsapp ? maskTelefone(c.whatsapp) : null} />
          <Campo label="CEP" value={c.cep ? maskCEP(c.cep) : null} />
          <Campo label="Endereço" value={endereco} />
          <Campo label="Bairro" value={c.bairro} />
          <Campo label="Complemento" value={c.complemento} />
          <Campo label="Cidade / UF" value={cidadeUf} />
          <Campo label="Cliente desde" value={<DateDisplay value={c.created_at} />} />
        </div>
        {c.observacoes ? (
          <div className="mt-4 border-t border-border/70 pt-4">
            <Campo label="Observações" value={c.observacoes} />
          </div>
        ) : null}
      </Section>

      <Section title="Histórico do cliente">
        <Tabs defaultValue="equipamentos">
          <TabsList>
            <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
            <TabsTrigger value="ordens">Ordens de Serviço</TabsTrigger>
            <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>
          <TabsContent value="equipamentos" className="pt-4">
            <EmptyState
              icon={Wrench}
              title="Nenhum equipamento vinculado"
              description="Os equipamentos cadastrados para este cliente aparecerão aqui."
            />
          </TabsContent>
          <TabsContent value="ordens" className="pt-4">
            <EmptyState
              icon={FileText}
              title="Nenhuma ordem de serviço"
              description="As ordens de serviço abertas para este cliente aparecerão aqui."
            />
          </TabsContent>
          <TabsContent value="orcamentos" className="pt-4">
            <EmptyState
              icon={Receipt}
              title="Nenhum orçamento"
              description="Os orçamentos emitidos para este cliente aparecerão aqui."
            />
          </TabsContent>
          <TabsContent value="historico" className="pt-4">
            <EmptyState
              icon={History}
              title="Sem histórico registrado"
              description="Alterações e interações futuras com este cliente aparecerão aqui."
            />
          </TabsContent>
        </Tabs>
      </Section>
    </>
  );
}
