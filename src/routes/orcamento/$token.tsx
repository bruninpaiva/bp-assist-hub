import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  FileDown,
  Loader2,
  MessageSquareWarning,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DetailField } from "@/components/common/DetailField";
import { Money } from "@/components/common/Money";
import { DateDisplay } from "@/components/common/DateDisplay";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { SIGNED_URL_REFRESH_MS } from "@/services/storage";
import { statusOrcamentoLabels, tipoItemOrcamentoLabels } from "@/lib/labels";
import { maskCNPJ, maskTelefone } from "@/lib/masks";
import { dataCurta } from "@/lib/format";
import { equipamentoLabel } from "@/routes/_authenticated/orcamentos/-lib/schema";
import { obterOrcamentoPublicoFn, registrarDecisaoOrcamentoFn } from "./-lib/serverFn";
import type { OrcamentoPublico } from "@/services/queries";
import type { AcaoAprovacaoOrcamento } from "@/types/domain";

export const Route = createFileRoute("/orcamento/$token")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Orçamento — BP Info" }],
  }),
  component: OrcamentoPublicoPage,
});

type ItemPublico = OrcamentoPublico["itens"][number] & { _key: number };

const itemColumns: DataTableColumn<ItemPublico>[] = [
  { key: "tipo", header: "Tipo", cell: (i) => tipoItemOrcamentoLabels[i.tipo] },
  { key: "descricao", header: "Descrição", cell: (i) => i.descricao },
  { key: "quantidade", header: "Qtde.", className: "text-right", cell: (i) => i.quantidade },
  {
    key: "valor_unitario",
    header: "Valor unit.",
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
    cell: (i) => <Money value={i.subtotal} />,
  },
];

const STATUS_DECIDIVEIS = ["rascunho", "enviado"];

function OrcamentoPublicoPage() {
  const { token } = Route.useParams();
  const queryClient = useQueryClient();
  const queryKey = ["orcamento-publico", token];

  const [confirmando, setConfirmando] = useState<"aprovado" | "recusado" | null>(null);
  const [alteracaoAberta, setAlteracaoAberta] = useState(false);
  const [mensagemAlteracao, setMensagemAlteracao] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => obterOrcamentoPublicoFn({ data: { token } }),
    retry: false,
    // A signed URL do PDF vem junto: renova antes de expirar.
    refetchInterval: SIGNED_URL_REFRESH_MS,
  });

  const pdfUrl = data?.pdf_url ?? null;

  const registrarDecisao = async (acao: AcaoAprovacaoOrcamento, mensagem?: string) => {
    setEnviando(true);
    try {
      await registrarDecisaoOrcamentoFn({ data: { token, acao, mensagem } });
      await queryClient.invalidateQueries({ queryKey });
      toast.success(
        acao === "aprovado"
          ? "Orçamento aprovado! Obrigado pela resposta."
          : acao === "recusado"
            ? "Orçamento reprovado. Registramos sua resposta."
            : "Pedido de alteração enviado. Entraremos em contato.",
      );
      setConfirmando(null);
      setAlteracaoAberta(false);
      setMensagemAlteracao("");
    } catch (err) {
      toast.error("Não foi possível registrar sua resposta", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setEnviando(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="surface-card w-full max-w-md p-8">
          <EmptyState
            icon={ShieldAlert}
            title="Link indisponível"
            description={
              error instanceof Error
                ? error.message
                : "Este link de aprovação é inválido, expirou ou foi revogado."
            }
          />
        </Card>
      </div>
    );
  }

  const { orcamento, os, cliente, equipamento, empresa, itens } = data;
  const decidivel = STATUS_DECIDIVEIS.includes(orcamento.status);
  const equipamentoTexto = equipamento ? equipamentoLabel(equipamento) : "—";
  const validoAte = new Date(
    new Date(orcamento.data_emissao).getTime() + orcamento.validade_dias * 86_400_000,
  ).toISOString();

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="surface-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-bold tracking-tight">
                {empresa?.nome_fantasia || "BP Info"}
              </p>
              <p className="text-xs text-muted-foreground">
                {[
                  empresa?.cnpj ? `CNPJ ${maskCNPJ(empresa.cnpj)}` : null,
                  empresa?.telefone ? maskTelefone(empresa.telefone) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <StatusBadge {...statusOrcamentoLabels[orcamento.status]} />
          </div>

          <Separator className="my-5" />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-bold tracking-tight">
              Orçamento nº {orcamento.numero}/{orcamento.ano}
            </h1>
            {pdfUrl ? (
              <Button asChild variant="outline" size="sm">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <FileDown className="size-4" /> Baixar PDF
                </a>
              </Button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <DetailField label="Cliente" value={cliente?.nome} />
            <DetailField label="Equipamento" value={equipamentoTexto} />
            <DetailField label="Ordem de serviço" value={os?.numero_os} />
            <DetailField
              label="Emitido em"
              value={<DateDisplay value={orcamento.data_emissao} />}
            />
            <DetailField label="Válido até" value={<DateDisplay value={validoAte} />} />
            {orcamento.data_aprovacao ? (
              <DetailField
                label="Aprovado em"
                value={<DateDisplay value={orcamento.data_aprovacao} mode="full" />}
              />
            ) : null}
          </div>
        </Card>

        <Card className="surface-card p-6 sm:p-8">
          <h2 className="mb-4 text-sm font-semibold">Itens do orçamento</h2>
          <DataTable
            columns={itemColumns}
            data={itens.map((item, index) => ({ ...item, _key: index }))}
            getRowKey={(i) => String(i._key)}
            emptyIcon={MessageSquareWarning}
            emptyTitle="Nenhum item neste orçamento"
          />

          <div className="mt-5 ml-auto max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <Money value={orcamento.subtotal} />
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Desconto</span>
              <Money value={orcamento.desconto} />
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <Money value={orcamento.total} />
            </div>
          </div>

          {orcamento.observacoes ? (
            <>
              <Separator className="my-5" />
              <DetailField label="Observações" value={orcamento.observacoes} />
            </>
          ) : null}
        </Card>

        <Card className="surface-card p-6 sm:p-8">
          {decidivel ? (
            <>
              <h2 className="mb-4 text-sm font-semibold">O que você deseja fazer?</h2>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setConfirmando("aprovado")} disabled={enviando}>
                  <CheckCircle2 className="size-4" /> Aprovar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirmando("recusado")}
                  disabled={enviando}
                >
                  <XCircle className="size-4" /> Reprovar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAlteracaoAberta(true)}
                  disabled={enviando}
                >
                  <MessageSquareWarning className="size-4" /> Solicitar alteração
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              icon={orcamento.status === "aprovado" ? CheckCircle2 : ShieldAlert}
              title={
                orcamento.status === "aprovado"
                  ? "Este orçamento já foi aprovado"
                  : orcamento.status === "recusado"
                    ? "Este orçamento foi reprovado"
                    : "Este orçamento não está mais disponível para resposta"
              }
              description={`Status atual: ${statusOrcamentoLabels[orcamento.status].label}.`}
            />
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          {empresa?.nome_fantasia || "BP Info"} · Documento gerado em{" "}
          {dataCurta(new Date().toISOString())}
        </p>
      </div>

      <ConfirmDialog
        open={confirmando !== null}
        onOpenChange={(open) => !open && setConfirmando(null)}
        title={confirmando === "aprovado" ? "Aprovar orçamento" : "Reprovar orçamento"}
        description={
          confirmando === "aprovado"
            ? "Ao confirmar, este orçamento será marcado como aprovado e a equipe será notificada para iniciar o serviço."
            : "Ao confirmar, este orçamento será marcado como reprovado."
        }
        confirmLabel={confirmando === "aprovado" ? "Aprovar" : "Reprovar"}
        variant={confirmando === "recusado" ? "destructive" : "default"}
        onConfirm={() => confirmando && void registrarDecisao(confirmando)}
      />

      <Dialog open={alteracaoAberta} onOpenChange={setAlteracaoAberta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar alteração</DialogTitle>
            <DialogDescription>
              Descreva o que você gostaria de alterar neste orçamento. Nossa equipe vai analisar e
              entrar em contato.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={mensagemAlteracao}
            onChange={(e) => setMensagemAlteracao(e.target.value)}
            placeholder="Ex.: gostaria de remover o item X, ou ajustar a quantidade de Y..."
          />
          <DialogFooter>
            <Button
              onClick={() => void registrarDecisao("alteracao_solicitada", mensagemAlteracao)}
              disabled={enviando || !mensagemAlteracao.trim()}
            >
              {enviando ? <LoadingState /> : null} Enviar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
