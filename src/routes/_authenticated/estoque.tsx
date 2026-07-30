import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateDisplay } from "@/components/common/DateDisplay";
import { Money } from "@/components/common/Money";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { TableSkeleton } from "@/components/tables/TableSkeleton";
import { toast } from "sonner";
import { Package, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { estoqueService, queryKeys } from "@/services/queries";
import { tipoMovimentacaoLabels } from "@/lib/labels";
import { numero } from "@/lib/format";
import type { CategoriaProduto, Fornecedor, MovimentacaoEstoque, Produto } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque — BP Info Gestão" },
      {
        name: "description",
        content: "Controle de produtos, categorias, fornecedores e movimentações de estoque.",
      },
      { property: "og:title", content: "Estoque — BP Info Gestão" },
      {
        property: "og:description",
        content: "Controle de produtos, categorias, fornecedores e movimentações de estoque.",
      },
    ],
  }),
  component: EstoquePage,
});

const produtoColumns: DataTableColumn<Produto>[] = [
  { key: "produto", header: "Produto", cell: (p) => <span className="font-medium">{p.nome}</span> },
  {
    key: "sku",
    header: "SKU",
    cell: (p) => <span className="font-mono text-xs">{p.sku || "—"}</span>,
  },
  {
    key: "custo",
    header: "Custo",
    className: "text-right",
    cell: (p) => <Money value={p.preco_custo} />,
  },
  {
    key: "venda",
    header: "Venda",
    className: "text-right",
    cell: (p) => <Money value={p.preco_venda} />,
  },
  {
    key: "estoque",
    header: "Estoque",
    className: "text-right",
    cell: (p) => (
      <StatusBadge
        label={`${numero(p.estoque_atual)} ${p.unidade}`}
        tone={Number(p.estoque_atual) <= Number(p.estoque_minimo) ? "warning" : "success"}
      />
    ),
  },
];

const fornecedorColumns: DataTableColumn<Fornecedor>[] = [
  {
    key: "fornecedor",
    header: "Fornecedor",
    cell: (f) => <span className="font-medium">{f.nome}</span>,
  },
  {
    key: "cnpj",
    header: "CNPJ",
    cell: (f) => <span className="font-mono text-xs">{f.cnpj || "—"}</span>,
  },
  { key: "contato", header: "Contato", cell: (f) => f.telefone || f.email || "—" },
  {
    key: "cidade",
    header: "Cidade",
    cell: (f) => [f.cidade, f.uf].filter(Boolean).join(" / ") || "—",
  },
];

type MovimentacaoRow = MovimentacaoEstoque & { produtos?: { nome: string } | null };

const movimentacaoColumns: DataTableColumn<MovimentacaoRow>[] = [
  {
    key: "produto",
    header: "Produto",
    cell: (m) => <span className="font-medium">{m.produtos?.nome ?? "—"}</span>,
  },
  {
    key: "tipo",
    header: "Tipo",
    cell: (m) => (
      <StatusBadge
        label={tipoMovimentacaoLabels[m.tipo]}
        tone={m.tipo === "entrada" ? "success" : m.tipo === "saida" ? "danger" : "neutral"}
      />
    ),
  },
  {
    key: "quantidade",
    header: "Quantidade",
    className: "text-right",
    cell: (m) => numero(m.quantidade),
  },
  {
    key: "data",
    header: "Data",
    className: "text-right",
    cell: (m) => (
      <span className="text-sm text-muted-foreground">
        <DateDisplay value={m.created_at} mode="full" />
      </span>
    ),
  },
];

function Produtos() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.produtos,
    queryFn: estoqueService.produtos,
  });
  return (
    <DataTable
      columns={produtoColumns}
      data={(data ?? []) as Produto[]}
      isLoading={isLoading}
      getRowKey={(p) => p.id}
      emptyIcon={Package}
      emptyTitle="Nenhum produto cadastrado"
      emptyDescription="Peças e componentes cadastrados aparecerão aqui com custo, preço e estoque mínimo."
    />
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
        <div key={c.id} className="surface-secondary">
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
  return (
    <DataTable
      columns={fornecedorColumns}
      data={(data ?? []) as Fornecedor[]}
      isLoading={isLoading}
      getRowKey={(f) => f.id}
      emptyIcon={Package}
      emptyTitle="Nenhum fornecedor"
      emptyDescription="Cadastre fornecedores para vincular a produtos e compras."
    />
  );
}

function Movimentacoes() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.movimentacoes,
    queryFn: estoqueService.movimentacoes,
  });
  return (
    <DataTable
      columns={movimentacaoColumns}
      data={(data ?? []) as MovimentacaoRow[]}
      isLoading={isLoading}
      getRowKey={(m) => m.id}
      emptyIcon={Package}
      emptyTitle="Nenhuma movimentação"
      emptyDescription="Entradas, saídas e ajustes de estoque ficarão registrados aqui."
    />
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

      <Section title="Controle de estoque">
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
      </Section>
    </>
  );
}
