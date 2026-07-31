import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  FileWarning,
  Pencil,
  Plus,
  Receipt,
  Wallet,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { TableSkeleton } from "@/components/tables/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateDisplay } from "@/components/common/DateDisplay";
import { DetailField } from "@/components/common/DetailField";
import { Money } from "@/components/common/Money";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { ordensService, orcamentosService, queryKeys } from "@/services/queries";
import {
  prioridadeLabels,
  statusOrdemServicoLabels,
  statusOrcamentoLabels,
  tipoEquipamentoLabels,
} from "@/lib/labels";
import { maskTelefone } from "@/lib/masks";
import type { Orcamento, OSComRelacoes } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/ordens/$id/")({
  head: () => ({
    meta: [{ title: "Ordem de serviço — BP Info Gestão" }],
  }),
  component: OrdemDetalhePage,
});

const orcamentoColumns: DataTableColumn<Orcamento>[] = [
  {
    key: "numero",
    header: "Número",
    cell: (orc) => (
      <Link
        to="/orcamentos/$id"
        params={{ id: orc.id }}
        className="font-mono text-xs font-medium text-foreground hover:text-primary-glow hover:underline"
      >
        {orc.numero}/{orc.ano}
      </Link>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (orc) => <StatusBadge {...statusOrcamentoLabels[orc.status]} />,
  },
  {
    key: "total",
    header: "Total",
    className: "text-right",
    cell: (orc) => (
      <span className="font-semibold">
        <Money value={orc.total} />
      </span>
    ),
  },
  {
    key: "emissao",
    header: "Emissão",
    className: "text-right",
    cell: (orc) => (
      <span className="text-sm text-muted-foreground">
        <DateDisplay value={orc.data_emissao} />
      </span>
    ),
  },
];

function OrdemDetalhePage() {
  const { id } = Route.useParams();

  const { data: ordem, isLoading } = useQuery({
    queryKey: queryKeys.ordem(id),
    queryFn: () => ordensService.get(id),
  });

  const orcamentosParams = { osId: id, porPagina: 50 };
  const { data: orcamentosData, isLoading: carregandoOrcamentos } = useQuery({
    queryKey: queryKeys.orcamentos(orcamentosParams),
    queryFn: () => orcamentosService.list(orcamentosParams),
  });

  if (isLoading) {
    return (
      <Section title="Carregando ordem de serviço...">
        <TableSkeleton rows={4} cols={2} />
      </Section>
    );
  }

  if (!ordem) {
    return (
      <Section title="Ordem de serviço">
        <EmptyState
          icon={FileWarning}
          title="Ordem de serviço não encontrada"
          description="Ela pode ter sido excluída."
        />
      </Section>
    );
  }

  const o = ordem as OSComRelacoes;
  const equipamentoTitulo = o.equipamentos
    ? [o.equipamentos.marca, o.equipamentos.modelo].filter(Boolean).join(" ") ||
      tipoEquipamentoLabels[o.equipamentos.tipo]
    : "—";
  const eventos = [...(o.os_eventos ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const garantiaAte =
    o.data_conclusao && o.garantia_dias
      ? new Date(new Date(o.data_conclusao).getTime() + o.garantia_dias * 86_400_000)
      : null;

  return (
    <>
      <PageHeader
        title={o.numero_os ?? `OS #${o.numero}`}
        description={`${o.clientes?.nome ?? "—"} · ${equipamentoTitulo}`}
        actions={
          <>
            <StatusBadge {...prioridadeLabels[o.prioridade]} />
            <StatusBadge {...statusOrdemServicoLabels[o.status]} />
            <Button asChild>
              <Link to="/ordens/$id/editar" params={{ id: o.id }}>
                <Pencil className="size-4" /> Editar
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Cliente">
          {o.clientes ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField
                label="Nome"
                value={
                  <Link
                    to="/clientes/$id"
                    params={{ id: o.clientes.id }}
                    className="hover:text-primary-glow hover:underline"
                  >
                    {o.clientes.nome}
                  </Link>
                }
              />
              <DetailField
                label="Contato"
                value={
                  o.clientes.whatsapp
                    ? maskTelefone(o.clientes.whatsapp)
                    : o.clientes.telefone
                      ? maskTelefone(o.clientes.telefone)
                      : null
                }
              />
              <DetailField label="E-mail" value={o.clientes.email} />
            </div>
          ) : (
            <EmptyState icon={FileWarning} title="Cliente não encontrado" />
          )}
        </Section>

        <Section title="Equipamento">
          {o.equipamentos ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField
                label="Equipamento"
                value={
                  <Link
                    to="/equipamentos/$id"
                    params={{ id: o.equipamentos.id }}
                    className="hover:text-primary-glow hover:underline"
                  >
                    {equipamentoTitulo}
                  </Link>
                }
              />
              <DetailField label="Tipo" value={tipoEquipamentoLabels[o.equipamentos.tipo]} />
              <DetailField label="Número de série" value={o.equipamentos.numero_serie} />
              <DetailField label="Patrimônio" value={o.equipamentos.patrimonio} />
            </div>
          ) : (
            <EmptyState icon={FileWarning} title="Equipamento não encontrado" />
          )}
        </Section>
      </div>

      <Section title="Diagnóstico e solução">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Problema relatado" value={o.problema_relatado} />
          <DetailField label="Diagnóstico" value={o.diagnostico} />
          <DetailField label="Serviços executados / solução" value={o.solucao} />
          <DetailField label="Observações" value={o.observacoes} />
        </div>
      </Section>

      <Section title="Valores e prazos">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField label="Mão de obra" value={<Money value={o.valor_mao_obra} />} />
          <DetailField label="Desconto" value={<Money value={o.desconto} />} />
          <DetailField label="Total" value={<Money value={o.valor_total} />} />
          <DetailField
            label="Técnico responsável"
            value={o.tecnico_responsavel ? "Atribuído" : "Não atribuído"}
          />
          <DetailField label="Data de entrada" value={<DateDisplay value={o.data_entrada} />} />
          <DetailField
            label="Previsão de entrega"
            value={o.previsao_entrega ? <DateDisplay value={o.previsao_entrega} /> : null}
          />
          <DetailField
            label="Data de conclusão"
            value={o.data_conclusao ? <DateDisplay value={o.data_conclusao} /> : null}
          />
          <DetailField
            label="Data de entrega"
            value={o.data_entrega ? <DateDisplay value={o.data_entrega} /> : null}
          />
        </div>
      </Section>

      <Section title="Acompanhamento">
        <Tabs defaultValue="historico">
          <TabsList>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="garantia">Garantia</TabsTrigger>
            <TabsTrigger value="pecas">Peças utilizadas</TabsTrigger>
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
            <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          </TabsList>

          <TabsContent value="historico" className="pt-4">
            {eventos.length === 0 ? (
              <EmptyState
                icon={FileWarning}
                title="Sem histórico registrado"
                description="As mudanças de status desta ordem de serviço aparecerão aqui automaticamente."
              />
            ) : (
              <ol className="relative space-y-5 border-l border-border pl-6">
                {eventos.map((evento) => (
                  <li key={evento.id} className="relative">
                    <span className="absolute top-1.5 -left-[27px] size-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
                    <p className="text-sm font-medium">{evento.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {evento.status ? statusOrdemServicoLabels[evento.status].label : null} ·{" "}
                      <DateDisplay value={evento.created_at} mode="full" />
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>

          <TabsContent value="garantia" className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Garantia (dias)" value={`${o.garantia_dias} dias`} />
              <DetailField
                label="Garantia até"
                value={garantiaAte ? <DateDisplay value={garantiaAte.toISOString()} /> : null}
              />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Controle detalhado de garantia por peça e por serviço chega em uma próxima etapa.
            </p>
          </TabsContent>

          <TabsContent value="pecas" className="pt-4">
            <EmptyState
              icon={Package}
              title="Nenhuma peça registrada"
              description="As peças baixadas do estoque para esta ordem de serviço aparecerão aqui."
            />
          </TabsContent>

          <TabsContent value="fotos" className="pt-4">
            <EmptyState
              icon={ImageIcon}
              title="Nenhuma foto registrada"
              description="Fotos específicas desta ordem de serviço poderão ser anexadas aqui."
            />
          </TabsContent>

          <TabsContent value="orcamento" className="pt-4 space-y-3">
            <div className="flex justify-end">
              <Button asChild variant="outline" size="sm">
                <Link to="/orcamentos/novo">
                  <Plus className="size-4" /> Novo orçamento
                </Link>
              </Button>
            </div>
            <DataTable
              columns={orcamentoColumns}
              data={orcamentosData?.data ?? []}
              isLoading={carregandoOrcamentos}
              getRowKey={(orc) => orc.id}
              emptyIcon={Receipt}
              emptyTitle="Nenhum orçamento vinculado"
              emptyDescription="Orçamentos gerados a partir desta ordem de serviço aparecerão aqui."
            />
          </TabsContent>

          <TabsContent value="financeiro" className="pt-4">
            <EmptyState
              icon={Wallet}
              title="Nenhum lançamento vinculado"
              description="Lançamentos financeiros gerados a partir desta ordem de serviço aparecerão aqui."
            />
          </TabsContent>
        </Tabs>
      </Section>
    </>
  );
}
