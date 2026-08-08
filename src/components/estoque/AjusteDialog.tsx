import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { estoqueService } from "@/services/queries";
import { numero } from "@/lib/format";
import type { Produto, ProdutoComRelacoes } from "@/types/domain";

const motivos = [
  "Contagem física",
  "Perda",
  "Produto danificado",
  "Correção de cadastro",
  "Devolução",
  "Outro",
];

/** Ajuste manual de inventário — sempre gera movimentação com motivo obrigatório. */
export function AjusteDialog({
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
  const [sentido, setSentido] = useState<"entrada" | "saida">("entrada");
  const [quantidade, setQuantidade] = useState("1");
  const [motivo, setMotivo] = useState(motivos[0]!);
  const [detalhe, setDetalhe] = useState("");

  useEffect(() => {
    if (!open) return;
    setProduto(produtoInicial ?? null);
    setSentido("entrada");
    setQuantidade("1");
    setMotivo(motivos[0]!);
    setDetalhe("");
  }, [open, produtoInicial]);

  const qtd = Number(quantidade) || 0;

  const ajustar = useMutation({
    mutationFn: () =>
      estoqueService.ajustar({
        produto_id: produto!.id,
        quantidade: qtd,
        sentido,
        motivo: detalhe.trim() ? `${motivo} — ${detalhe.trim()}` : motivo,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["produtos"] }),
        queryClient.invalidateQueries({ queryKey: ["movimentacoes"] }),
      ]);
      toast.success("Ajuste registrado.");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajuste manual de estoque</DialogTitle>
          <DialogDescription>
            Use para correções de inventário. O saldo nunca é sobrescrito: o ajuste entra como
            movimentação.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Produto *</Label>
            <ProdutoCombobox
              value={produto?.id}
              onChange={(p: ProdutoComRelacoes) => setProduto(p)}
            />
            {produto ? (
              <p className="text-xs text-muted-foreground">
                Estoque atual: {numero(produto.estoque_atual)} {produto.unidade} · Reservado:{" "}
                {numero(produto.estoque_reservado)}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={sentido}
                onValueChange={(v) => setSentido(v as "entrada" | "saida")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Ajuste de entrada (+)</SelectItem>
                  <SelectItem value="saida">Ajuste de saída (−)</SelectItem>
                </SelectContent>
              </Select>
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
          </div>

          <div className="space-y-2">
            <Label>Motivo *</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {motivos.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Detalhamento</Label>
            <Textarea rows={2} value={detalhe} onChange={(e) => setDetalhe(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!produto || qtd <= 0 || ajustar.isPending}
            onClick={() => ajustar.mutate()}
          >
            Registrar ajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}