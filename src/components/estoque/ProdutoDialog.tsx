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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { estoqueService, queryKeys } from "@/services/queries";
import type { CategoriaProduto, Produto } from "@/types/domain";

interface ProdutoFormState {
  nome: string;
  descricao: string;
  categoria_id: string;
  marca: string;
  modelo: string;
  sku_fabricante: string;
  localizacao: string;
  unidade: string;
  estoque_minimo: string;
  preco_custo: string;
  preco_venda: string;
  observacoes: string;
  ativo: boolean;
}

const vazio: ProdutoFormState = {
  nome: "",
  descricao: "",
  categoria_id: "",
  marca: "",
  modelo: "",
  sku_fabricante: "",
  localizacao: "",
  unidade: "un",
  estoque_minimo: "0",
  preco_custo: "0",
  preco_venda: "0",
  observacoes: "",
  ativo: true,
};

/**
 * Cadastro/edição de produto. O estoque nunca é informado aqui — quantidade só
 * muda por entrada, ajuste ou movimentação de OS.
 */
export function ProdutoDialog({
  open,
  onOpenChange,
  produto,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto?: Produto | null;
  onSaved?: (produto: Produto) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProdutoFormState>(vazio);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [criandoCategoria, setCriandoCategoria] = useState(false);

  const { data: categorias } = useQuery({
    queryKey: queryKeys.categoriasProduto,
    queryFn: estoqueService.categorias,
  });

  useEffect(() => {
    if (!open) return;
    setNovaCategoria("");
    setCriandoCategoria(false);
    setForm(
      produto
        ? {
            nome: produto.nome,
            descricao: produto.descricao ?? "",
            categoria_id: produto.categoria_id ?? "",
            marca: produto.marca ?? "",
            modelo: produto.modelo ?? "",
            sku_fabricante: produto.sku_fabricante ?? "",
            localizacao: produto.localizacao ?? "",
            unidade: produto.unidade,
            estoque_minimo: String(produto.estoque_minimo),
            preco_custo: String(produto.preco_custo),
            preco_venda: String(produto.preco_venda),
            observacoes: produto.observacoes ?? "",
            ativo: produto.ativo,
          }
        : vazio,
    );
  }, [open, produto]);

  const set = <K extends keyof ProdutoFormState>(key: K, value: ProdutoFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const criarCategoria = useMutation({
    mutationFn: () => estoqueService.criarCategoria(novaCategoria),
    onSuccess: async (categoria: CategoriaProduto) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categoriasProduto });
      set("categoria_id", categoria.id);
      setNovaCategoria("");
      setCriandoCategoria(false);
      toast.success("Categoria criada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        categoria_id: form.categoria_id || null,
        marca: form.marca.trim() || null,
        modelo: form.modelo.trim() || null,
        sku_fabricante: form.sku_fabricante.trim() || null,
        localizacao: form.localizacao.trim() || null,
        unidade: form.unidade.trim() || "un",
        estoque_minimo: Number(form.estoque_minimo) || 0,
        preco_custo: Number(form.preco_custo) || 0,
        preco_venda: Number(form.preco_venda) || 0,
        observacoes: form.observacoes.trim() || null,
        ativo: form.ativo,
      };
      return produto
        ? estoqueService.atualizarProduto(produto.id, payload)
        : estoqueService.criarProduto(payload);
    },
    onSuccess: async (salvo) => {
      await queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success(produto ? "Produto atualizado." : "Produto cadastrado.");
      onOpenChange(false);
      onSaved?.(salvo as Produto);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{produto ? "Editar produto" : "Novo produto / peça"}</DialogTitle>
          <DialogDescription>
            O código interno é gerado automaticamente. A quantidade em estoque é alterada apenas por
            entradas, ajustes e movimentações de OS.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Categoria</Label>
            {criandoCategoria ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  placeholder="Ex.: Memória RAM"
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                />
                <Button
                  type="button"
                  disabled={!novaCategoria.trim() || criarCategoria.isPending}
                  onClick={() => criarCategoria.mutate()}
                >
                  Salvar
                </Button>
                <Button type="button" variant="ghost" onClick={() => setCriandoCategoria(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select
                  value={form.categoria_id}
                  onValueChange={(value) => set("categoria_id", value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categorias ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={() => setCriandoCategoria(true)}>
                  <Plus className="size-4" /> Nova
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Marca</Label>
            <Input value={form.marca} onChange={(e) => set("marca", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Modelo / referência</Label>
            <Input value={form.modelo} onChange={(e) => set("modelo", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Código / SKU do fabricante</Label>
            <Input
              value={form.sku_fabricante}
              onChange={(e) => set("sku_fabricante", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Localização física</Label>
            <Input
              placeholder="Ex.: Prateleira A2"
              value={form.localizacao}
              onChange={(e) => set("localizacao", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Unidade</Label>
            <Input value={form.unidade} onChange={(e) => set("unidade", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Estoque mínimo</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={form.estoque_minimo}
              onChange={(e) => set("estoque_minimo", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Preço de custo</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.preco_custo}
              onChange={(e) => set("preco_custo", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Preço de venda</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.preco_venda}
              onChange={(e) => set("preco_venda", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea
              rows={2}
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Observações</Label>
            <Textarea
              rows={2}
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} />
            <span className="text-sm">{form.ativo ? "Produto ativo" : "Produto inativo"}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!form.nome.trim() || salvar.isPending}
            onClick={() => salvar.mutate()}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
