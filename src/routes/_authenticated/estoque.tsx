import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import { Package, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { estoqueService, queryKeys } from "@/services/queries";
import { tipoMovimentacaoLabels } from "@/lib/labels";
import { brl, dataHora, numero } from "@/lib/format";
import type {
  CategoriaProduto,
  Fornecedor,
  MovimentacaoEstoque,
  Produto,
} from "@/types/domain";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque — BP Info Gestão" },
      { name: "description", content: "Controle de produtos, categorias, fornecedores e movimentações de estoque." },
      { property: "og:title", content: "Estoque — BP Info Gestão" },
      { property: "og:description", content: "Controle de produtos, categorias, fornecedores e movimentações de estoque." },
    ],
  }),
  component: EstoquePage,
});

function Produtos() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.produtos,
    queryFn: estoqueService.produtos,
  });
  const produtos = (data ?? []) as Produto[];
  if (isLoading) return <TableSkeleton cols={5} />;
  if (!produtos.length)
    return (
      <EmptyState
        icon={Package}
        title="Nenhum produto cadastrado"
        description="Peças e componentes cadastrados aparecerão aqui com custo, preço e estoque mínimo."
      />
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead className="text-right">Custo</TableHead>
          <TableHead className="text-right">Venda</TableHead>
          <TableHead className="text-right">Estoque</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {produtos.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.nome}</TableCell>
            <TableCell className="font-mono text-xs">{p.sku || "—"}</TableCell>
            <TableCell className="text-right">{brl(p.preco_custo)}</TableCell>
            <TableCell className="text-right">{brl(p.preco_venda)}</TableCell>
            <TableCell className="text-right">
              <StatusBadge
                label={`${numero(p.estoque_atual)} ${p.unidade}`}
                tone={Number(p.estoque_atual) <= Number(p.estoque_minimo) ? "warning" : "success"}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Categorias() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.categoriasProduto,
    queryFn: estoqueService.categorias,
  });
  const categorias = (data ?? []) as CategoriaProduto[];
  if (isLoading) return <TableSkeleton cols={2} />;
  if (!categorias.length)
    return (
      <EmptyState
        icon={Package}
        title="Nenhuma categoria"
        description="Organize peças por categoria para relatórios e buscas mais rápidas."
      />
    );
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {categorias.map((c) => (
        <div key={c.id} className="rounded-lg border border-border/70 bg-muted/20 px-3.5 py-3">
          <p className="text-sm font-medium">{c.nome}</p>
          <p className="text-xs text-muted-foreground">{c.descricao || "Sem descrição"}</p>
        </div>
      ))}
    </div>
  );
}

function Fornecedores() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.fornecedores,
    queryFn: estoqueService.fornecedores,
  });
  const fornecedores = (data ?? []) as Fornecedor[];
  if (isLoading) return <TableSkeleton cols={4} />;
  if (!fornecedores.length)
    return (
      <EmptyState
        icon={Package}
        title="Nenhum fornecedor"
        description="Cadastre fornecedores para vincular a produtos e compras."
      />
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fornecedor</TableHead>
          <TableHead>CNPJ</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead>Cidade</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fornecedores.map((f) => (
          <TableRow key={f.id}>
            <TableCell className="font-medium">{f.nome}</TableCell>
            <TableCell className="font-mono text-xs">{f.cnpj || "—"}</TableCell>
            <TableCell>{f.telefone || f.email || "—"}</TableCell>
            <TableCell>{[f.cidade, f.uf].filter(Boolean).join(" / ") || "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Movimentacoes() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.movimentacoes,
    queryFn: estoqueService.movimentacoes,
  });
  const movs = (data ?? []) as (MovimentacaoEstoque & { produtos?: { nome: string } | null })[];
  if (isLoading) return <TableSkeleton cols={4} />;
  if (!movs.length)
    return (
      <EmptyState
        icon={Package}
        title="Nenhuma movimentação"
        description="Entradas, saídas e ajustes de estoque ficarão registrados aqui."
      />
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Quantidade</TableHead>
          <TableHead className="text-right">Data</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movs.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="font-medium">{m.produtos?.nome ?? "—"}</TableCell>
            <TableCell>
              <StatusBadge
                label={tipoMovimentacaoLabels[m.tipo]}
                tone={m.tipo === "entrada" ? "success" : m.tipo === "saida" ? "danger" : "neutral"}
              />
            </TableCell>
            <TableCell className="text-right">{numero(m.quantidade)}</TableCell>
            <TableCell className="text-right text-sm text-muted-foreground">
              {dataHora(m.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EstoquePage() {
  return (
    <>
      <PageHeader
        title="Estoque"
        description="Peças, componentes e insumos utilizados nos atendimentos técnicos."
        actions={
          <Button onClick={() => toast.info("Cadastro de produtos chega no próximo módulo.")}>
            <Plus className="size-4" /> Novo produto
          </Button>
        }
      />

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-base">Controle de estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="produtos">
            <TabsList>
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
              <TabsTrigger value="categorias">Categorias</TabsTrigger>
              <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
              <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
            </TabsList>
            <TabsContent value="produtos" className="pt-4">
              <Produtos />
            </TabsContent>
            <TabsContent value="categorias" className="pt-4">
              <Categorias />
            </TabsContent>
            <TabsContent value="movimentacoes" className="pt-4">
              <Movimentacoes />
            </TabsContent>
            <TabsContent value="fornecedores" className="pt-4">
              <Fornecedores />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
