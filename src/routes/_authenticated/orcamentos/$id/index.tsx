import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Copy,
  FileDown,
  FileWarning,
  MoreHorizontal,
  Pencil,
  QrCode,
  Signature,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { TableSkeleton } from "@/components/tables/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateDisplay } from "@/components/common/DateDisplay";
import { DetailField } from "@/components/common/DetailField";
import { Money } from "@/components/common/Money";
import { LoadingState } from "@/components/common/LoadingState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { configService, orcamentosService, queryKeys } from "@/services/queries";
import { acaoAprovacaoLabels, statusOrcamentoLabels, tipoItemOrcamentoLabels } from "@/lib/labels";
import { equipamentoLabel } from "../-lib/schema";
import { gerarOrcamentoPdfBlob } from "../-lib/pdf";
import { LinkPublicoAcoes } from "../-components/LinkPublicoAcoes";
import type { OrcamentoComRelacoes, OrcamentoItem } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/orcamentos/$id/")({
  head: () => ({
    meta: [{ title: "Orçamento — BP Info Gestão" }],
  }),
  component: OrcamentoDetalhePage,
});

const itemColumns: DataTableColumn<OrcamentoItem>[] = [
  { key: "tipo", header: "Tipo", cell: (i) => tipoItemOrcamentoLabels[i.tipo] },
  { key: "descricao", header: "Descrição", cell: (i) => i.descricao },
  { key: "quantidade", header: "Qtde.", className: "text-right", cell: (i) => i.quantidade },
  {
    key: "valor_unitario",
    header: "Valor unitário",
    className: "text-right",
    cell: (i) => <Money value={i.valor_unitario} />,
  },
  {
    key: "desconto",
    header: "Desconto",
    className: "text-right",
    cell: (i) => <Money value={i.desconto} />,
  },
  {
    key: "subtotal",
    header: "Subtotal",
    className: "text-right",
    cell: (i) => (
      <span className="font-semibold">
        <Money value={i.subtotal} />
      </span>
    ),
  },
];

function OrcamentoDetalhePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [excluindo, setExcluindo] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const { data: orcamento, isLoading } = useQuery({
    queryKey: queryKeys.orcamento(id),
    queryFn: () => orcamentosService.get(id),
  });

  const { data: empresa } = useQuery({
    queryKey: queryKeys.empresa,
    queryFn: configService.empresa,
  });

  const handleExportarPdf = async () => {
    if (!orcamento) return;
    const o = orcamento as OrcamentoComRelacoes;
    setGerandoPdf(true);
    try {
      const blob = await gerarOrcamentoPdfBlob({
        numero: o.numero,
        ano: o.ano,
        status: o.status,
        dataEmissao: o.data_emissao,
        validadeDias: o.validade_dias,
        observacoes: o.observacoes,
        subtotal: o.subtotal,
        desconto: o.desconto,
        total: o.total,
        osNumero: o.ordens_servico?.numero_os ?? null,
        cliente: o.clientes ? { nome: o.clientes.nome } : null,
        equipamento: o.equipamentos
          ? {
              tipo: o.equipamentos.tipo,
              marca: o.equipamentos.marca,
              modelo: o.equipamentos.modelo,
              numero_serie: o.equipamentos.numero_serie,
            }
          : null,
        itens: (o.orcamento_itens ?? []).map((item) => ({
          tipo: item.tipo,
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          desconto: item.desconto,
          subtotal: item.subtotal,
        })),
        empresa: empresa ?? null,
      });
      const url = await orcamentosService.salvarPdf(o.id, blob);
      await queryClient.invalidateQueries({ queryKey: queryKeys.orcamento(id) });
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("PDF gerado e salvo");
    } catch (error) {
      toast.error("Não foi possível gerar o PDF", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setGerandoPdf(false);
    }
  };

  const handleDuplicar = async () => {
    try {
      const novo = await orcamentosService.duplicar(id);
      await queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast.success("Orçamento duplicado como rascunho");
      void navigate({ to: "/orcamentos/$id", params: { id: novo.id } });
    } catch (error) {
      toast.error("Não foi possível duplicar o orçamento", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleExcluir = async () => {
    try {
      await orcamentosService.softDelete(id);
      await queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast.success("Orçamento excluído");
      void navigate({ to: "/orcamentos" });
    } catch (error) {
      toast.error("Não foi possível excluir o orçamento", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setExcluindo(false);
    }
  };

  if (isLoading) {
    return (
      <Section title="Carregando orçamento...">
        <TableSkeleton rows={4} cols={2} />
      </Section>
    );
  }

  if (!orcamento) {
    return (
      <Section title="Orçamento">
        <EmptyState
          icon={FileWarning}
          title="Orçamento não encontrado"
          description="Ele pode ter sido excluído."
        />
      </Section>
    );
  }

  const o = orcamento as OrcamentoComRelacoes;
  const equipamentoTitulo = o.equipamentos ? equipamentoLabel(o.equipamentos) : "—";
  const itens = o.orcamento_itens ?? [];
  const eventos = [...(o.orcamento_eventos ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const expiraEm = new Date(
    new Date(o.data_emissao).getTime() + o.validade_dias * 86_400_000,
  ).toISOString();

  return (
    <>
      <PageHeader
        title={`Orçamento ${o.numero}/${o.ano}`}
        description={`${o.clientes?.nome ?? "—"} · ${equipamentoTitulo}`}
        actions={
          <>
            <StatusBadge {...statusOrcamentoLabels[o.status]} />
            <Button asChild>
              <Link to="/orcamentos/$id/editar" params={{ id: o.id }}>
                <Pencil className="size-4" /> Editar
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Mais ações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => void handleDuplicar()}>
                  <Copy className="size-4" /> Duplicar orçamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExportarPdf()} disabled={gerandoPdf}>
                  <FileDown className="size-4" /> Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setExcluindo(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Ordem de serviço">
          <DetailField
            label="OS"
            value={
              o.ordens_servico ? (
                <Link
                  to="/ordens/$id"
                  params={{ id: o.ordens_servico.id }}
                  className="hover:text-primary-glow hover:underline"
                >
                  {o.ordens_servico.numero_os}
                </Link>
              ) : null
            }
          />
          <DetailField label="Problema relatado" value={o.ordens_servico?.problema_relatado} />
        </Section>

        <Section title="Cliente">
          <DetailField
            label="Nome"
            value={
              o.clientes ? (
                <Link
                  to="/clientes/$id"
                  params={{ id: o.clientes.id }}
                  className="hover:text-primary-glow hover:underline"
                >
                  {o.clientes.nome}
                </Link>
              ) : null
            }
          />
        </Section>

        <Section title="Equipamento">
          <DetailField
            label="Equipamento"
            value={
              o.equipamentos ? (
                <Link
                  to="/equipamentos/$id"
                  params={{ id: o.equipamentos.id }}
                  className="hover:text-primary-glow hover:underline"
                >
                  {equipamentoTitulo}
                </Link>
              ) : null
            }
          />
        </Section>
      </div>

      <Section title="Itens do orçamento">
        <DataTable
          columns={itemColumns}
          data={itens}
          getRowKey={(i) => i.id}
          emptyIcon={FileWarning}
          emptyTitle="Nenhum item neste orçamento"
        />
      </Section>

      <Section title="Valores e validade">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField label="Subtotal" value={<Money value={o.subtotal} />} />
          <DetailField label="Desconto" value={<Money value={o.desconto} />} />
          <DetailField label="Total" value={<Money value={o.total} />} />
          <DetailField label="Validade" value={`${o.validade_dias} dias`} />
          <DetailField label="Emitido em" value={<DateDisplay value={o.data_emissao} />} />
          <DetailField label="Expira em" value={<DateDisplay value={expiraEm} />} />
          <DetailField
            label="Aprovado em"
            value={o.data_aprovacao ? <DateDisplay value={o.data_aprovacao} /> : null}
          />
        </div>
      </Section>

      <Section title="Observações">
        <DetailField label="Observações" value={o.observacoes} />
      </Section>

      <Section
        title="Compartilhamento e aprovação"
        description="Gere o PDF e o link público para o cliente aprovar, reprovar ou pedir alterações sem login."
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void handleExportarPdf()} disabled={gerandoPdf}>
            {gerandoPdf ? <LoadingState /> : <FileDown className="size-4" />} Exportar PDF
          </Button>
          <LinkPublicoAcoes orcamento={o} />
          <Button variant="outline" onClick={() => toast.info("QR Code será habilitado em breve.")}>
            <QrCode className="size-4" /> Gerar QR Code
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.info("Assinatura eletrônica será habilitada em breve.")}
          >
            <Signature className="size-4" /> Assinatura eletrônica
          </Button>
        </div>
      </Section>

      {(o.orcamento_aprovacoes ?? []).length > 0 ? (
        <Section title="Aprovações do cliente">
          <div className="space-y-3">
            {(o.orcamento_aprovacoes ?? []).map((aprovacao) => (
              <div key={aprovacao.id} className="surface-secondary space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge {...acaoAprovacaoLabels[aprovacao.acao]} />
                  <span className="text-xs text-muted-foreground">
                    <DateDisplay value={aprovacao.created_at} mode="full" />
                  </span>
                </div>
                {aprovacao.mensagem ? <p className="text-sm">{aprovacao.mensagem}</p> : null}
                <p className="text-xs text-muted-foreground">
                  IP {aprovacao.ip ?? "—"} · {aprovacao.user_agent ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Histórico">
        {eventos.length === 0 ? (
          <EmptyState
            icon={FileWarning}
            title="Sem histórico registrado"
            description="As mudanças de status deste orçamento aparecerão aqui automaticamente."
          />
        ) : (
          <ol className="relative space-y-5 border-l border-border pl-6">
            {eventos.map((evento) => (
              <li key={evento.id} className="relative">
                <span className="absolute top-1.5 -left-[27px] size-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
                <p className="text-sm font-medium">{evento.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {evento.status ? statusOrcamentoLabels[evento.status].label : null} ·{" "}
                  <DateDisplay value={evento.created_at} mode="full" />
                </p>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <ConfirmDialog
        open={excluindo}
        onOpenChange={setExcluindo}
        title="Excluir orçamento"
        description={`Tem certeza que deseja excluir o orçamento nº ${o.numero}/${o.ano}? Ele deixará de aparecer nas listagens, mas o histórico é preservado.`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => void handleExcluir()}
      />
    </>
  );
}
