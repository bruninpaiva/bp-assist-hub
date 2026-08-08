import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProdutoCombobox } from "@/components/estoque/ProdutoCombobox";
import { ProdutoDialog } from "@/components/estoque/ProdutoDialog";
import { estoqueService, queryKeys } from "@/services/queries";
import { brl, numero } from "@/lib/format";
import type { Produto, ProdutoComRelacoes } from "@/types/domain";

const hoje = () => new Date().toISOString().slice(0, 10);

/** Entrada de compra: soma ao estoque e recalcula o custo médio ponderado. */
export function EntradaDialog({
  open,
  onOpenChange,
  produtoInicial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produtoInicial?: Produto | null;
}) {
  const queryClient = useQueryClient();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState("1");
  const [valorUnitario, setValorUnitario] = useState("0");
  const [fornecedorId, setFornecedorId] = useState("");
  const [documento, setDocumento] = useState("");
  const [dataCompra, setDataCompra] = useState(hoje());
  const [observacao, setObservacao] = useState("");
  const [novoProdutoAberto, setNovoProdutoAberto] = useState(false);

  const { data: fornecedores } = useQuery({
    queryKey: queryKeys.fornecedores,
    queryFn: estoqueService.fornecedores,
  });

  useEffect(() => {
    if (!open) return;
    setProduto(produtoInicial ?? null);
    setQuantidade("1");
    setValorUnitario(produtoInicial ? String(produtoInicial.preco_custo) : "0");
    setFornecedorId("");
    setDocumento("");
    setDataCompra(hoje());
    setObservacao("");
  }, [open, produtoInicial]);

  const qtd = Number(quantidade) || 0;
  const valor = Number(valorUnitario) || 0;
  const custoMedioProjetado = produto
    ? (Number(produto.estoque_atual) * Number(produto.custo_medio) + qtd * valor) /
      Math.max(Number(produto.estoque_atual) + qtd, 1)
    : 0;

  const registrar = useMutation({
    mutationFn: () =>
      estoqueService.registrarEntrada({
        produto_id: produto!.id,
        quantidade: qtd,
        valor_unitario: valor,
        fornecedor_id: fornecedorId || null,
        documento: documento.trim() || null,
        data_compra: dataCompra || null,
        observacao: observacao.trim() || null,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["produtos"] }),
        queryClient.invalidateQueries({ queryKey: ["movimentacoes"] }),
      ]);
      toast.success("Entrada registrada e custo médio atualizado.");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Registrar entrada</DialogTitle>
            <DialogDescription>
              A quantidade é somada ao estoque e o custo médio é recalculado automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Produto *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setNovoProdutoAberto(true)}
                >
                  <Plus className="size-4" /> Cadastrar novo
                </Button>
              </div>
              <ProdutoCombobox
                value={produto?.id}
                onChange={(p: ProdutoComRelacoes) => {
                  setProduto(p);
                  setValorUnitario(String(p.preco_custo));
                }}
              />
              {produto ? (
                <p className="text-xs text-muted-foreground">
                  Estoque atual: {numero(produto.estoque_atual)} {produto.unidade} · Custo médio
                  atual: {brl(produto.custo_medio)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor unitário de compra *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={valorUnitario}
                onChange={(e) => setValorUnitario(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select value={fornecedorId} onValueChange={setFornecedorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {(fornecedores ?? []).map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nota / documento</Label>
              <Input value={documento} onChange={(e) => setDocumento(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data da compra</Label>
              <Input
                type="date"
                value={dataCompra}
                onChange={(e) => setDataCompra(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Observação</Label>
              <Textarea
                rows={2}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            {produto && qtd > 0 ? (
              <p className="surface-secondary text-xs sm:col-span-2">
                Após esta entrada: {numero(Number(produto.estoque_atual) + qtd)} {produto.unidade} em
                estoque · custo médio estimado {brl(custoMedioProjetado)}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!produto || qtd <= 0 || registrar.isPending}
              onClick={() => registrar.mutate()}
            >
              Registrar entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProdutoDialog
        open={novoProdutoAberto}
        onOpenChange={setNovoProdutoAberto}
        onSaved={(p) => {
          setProduto(p);
          setValorUnitario(String(p.preco_custo));
        }}
      />
    </>
  );
}