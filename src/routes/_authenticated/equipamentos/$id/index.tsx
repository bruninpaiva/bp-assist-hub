import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, HardDriveIcon, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { TableSkeleton } from "@/components/tables/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateDisplay } from "@/components/common/DateDisplay";
import { DetailField } from "@/components/common/DetailField";
import { equipamentosService, queryKeys } from "@/services/queries";
import { statusEquipamentoLabels, tipoEquipamentoLabels } from "@/lib/labels";
import { maskTelefone } from "@/lib/masks";
import type { EquipamentoComRelacoes } from "@/types/domain";
import { FotosGaleria } from "../-components/FotosGaleria";

export const Route = createFileRoute("/_authenticated/equipamentos/$id/")({
  head: () => ({
    meta: [{ title: "Equipamento — BP Info Gestão" }],
  }),
  component: EquipamentoDetalhePage,
});

function EquipamentoDetalhePage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: equipamento, isLoading } = useQuery({
    queryKey: queryKeys.equipamento(id),
    queryFn: () => equipamentosService.get(id),
  });

  const recarregar = () =>
    void queryClient.invalidateQueries({ queryKey: queryKeys.equipamento(id) });

  if (isLoading) {
    return (
      <Section title="Carregando equipamento...">
        <TableSkeleton rows={4} cols={2} />
      </Section>
    );
  }

  if (!equipamento) {
    return (
      <Section title="Equipamento">
        <EmptyState
          icon={HardDriveIcon}
          title="Equipamento não encontrado"
          description="Ele pode ter sido excluído."
        />
      </Section>
    );
  }

  const e = equipamento as EquipamentoComRelacoes;
  const titulo = [e.marca, e.modelo].filter(Boolean).join(" ") || tipoEquipamentoLabels[e.tipo];
  const checklist = e.equipamento_checklist ?? [];
  const eventos = [...(e.equipamento_eventos ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <>
      <PageHeader
        title={titulo}
        description={`${tipoEquipamentoLabels[e.tipo]} · Cliente: ${e.clientes?.nome ?? "—"}`}
        actions={
          <>
            <StatusBadge {...statusEquipamentoLabels[e.status]} />
            <Button asChild>
              <Link to="/equipamentos/$id/editar" params={{ id: e.id }}>
                <Pencil className="size-4" /> Editar
              </Link>
            </Button>
          </>
        }
      />

      <Section title="Dados técnicos">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField
            label="Cliente"
            value={
              e.clientes ? (
                <Link
                  to="/clientes/$id"
                  params={{ id: e.clientes.id }}
                  className="hover:text-primary-glow hover:underline"
                >
                  {e.clientes.nome}
                </Link>
              ) : null
            }
          />
          <DetailField
            label="Contato do cliente"
            value={
              e.clientes?.whatsapp
                ? maskTelefone(e.clientes.whatsapp)
                : e.clientes?.telefone
                  ? maskTelefone(e.clientes.telefone)
                  : null
            }
          />
          <DetailField label="Número de série" value={e.numero_serie} />
          <DetailField label="Patrimônio" value={e.patrimonio} />
          <DetailField label="Processador" value={e.processador} />
          <DetailField label="Memória RAM" value={e.memoria_ram} />
          <DetailField label="Armazenamento" value={e.armazenamento} />
          <DetailField label="Sistema operacional" value={e.sistema_operacional} />
          <DetailField label="Senha informada" value={e.senha_informada} />
          <DetailField label="Estado físico" value={e.estado_fisico} />
          <DetailField label="Data de entrada" value={<DateDisplay value={e.data_entrada} />} />
          <DetailField
            label="Previsão de entrega"
            value={e.previsao_entrega ? <DateDisplay value={e.previsao_entrega} /> : null}
          />
          <DetailField
            label="Garantia até"
            value={e.garantia_ate ? <DateDisplay value={e.garantia_ate} /> : null}
          />
        </div>
        <div className="mt-4 grid gap-4 border-t border-border/70 pt-4 sm:grid-cols-2">
          <DetailField label="Defeito informado" value={e.defeito_informado} />
          <DetailField label="Diagnóstico" value={e.diagnostico} />
        </div>
        {e.observacoes ? (
          <div className="mt-4 border-t border-border/70 pt-4">
            <DetailField label="Observações" value={e.observacoes} />
          </div>
        ) : null}
      </Section>

      <Section title="Acompanhamento">
        <Tabs defaultValue="checklist">
          <TabsList>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="ordens">Ordens de Serviço</TabsTrigger>
            <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="pt-4">
            {checklist.length === 0 ? (
              <EmptyState
                icon={HardDriveIcon}
                title="Nenhum item de checklist registrado"
                description="O checklist de entrada aparecerá aqui assim que for preenchido na edição do equipamento."
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {checklist.map((item) => (
                  <div key={item.id} className="surface-secondary flex items-start gap-3">
                    {item.presente ? (
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    ) : (
                      <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.checklist_itens?.nome ?? "Item"}</p>
                      {item.observacao ? (
                        <p className="text-xs text-muted-foreground">{item.observacao}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="fotos" className="pt-4">
            <FotosGaleria
              equipamentoId={e.id}
              fotos={e.equipamento_fotos ?? []}
              onChange={recarregar}
            />
          </TabsContent>

          <TabsContent value="historico" className="pt-4">
            {eventos.length === 0 ? (
              <EmptyState
                icon={HardDriveIcon}
                title="Sem histórico registrado"
                description="As mudanças de status deste equipamento aparecerão aqui automaticamente."
              />
            ) : (
              <ol className="relative space-y-5 border-l border-border pl-6">
                {eventos.map((evento) => (
                  <li key={evento.id} className="relative">
                    <span className="absolute top-1.5 -left-[27px] size-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
                    <p className="text-sm font-medium">{evento.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {evento.status ? statusEquipamentoLabels[evento.status].label : null} ·{" "}
                      <DateDisplay value={evento.created_at} mode="full" />
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>

          <TabsContent value="ordens" className="pt-4">
            <EmptyState
              icon={HardDriveIcon}
              title="Nenhuma ordem de serviço"
              description="As ordens de serviço abertas para este equipamento aparecerão aqui."
            />
          </TabsContent>

          <TabsContent value="orcamentos" className="pt-4">
            <EmptyState
              icon={HardDriveIcon}
              title="Nenhum orçamento"
              description="Os orçamentos relacionados a este equipamento aparecerão aqui."
            />
          </TabsContent>
        </Tabs>
      </Section>
    </>
  );
}
