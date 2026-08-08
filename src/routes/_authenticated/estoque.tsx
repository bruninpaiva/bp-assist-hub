import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDownUp,
  Ban,
  Boxes,
  CheckCircle2,
  DollarSign,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateDisplay } from "@/components/common/DateDisplay";
import { Money } from "@/components/common/Money";
import { SearchBar } from "@/components/common/SearchBar";
import { MetricCard } from "@/components/cards/MetricCard";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { TableSkeleton } from "@/components/tables/TableSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProdutoDialog } from "@/components/estoque/ProdutoDialog";
import { EntradaDialog } from "@/components/estoque/EntradaDialog";
import { AjusteDialog } from "@/components/estoque/AjusteDialog";
import { estoqueService, queryKeys, type EstoqueFiltro } from "@/services/queries";
import { useDebounced } from "@/hooks/use-debounced";
import { tipoMovimentacaoLabels } from "@/lib/labels";
import { brl, numero } from "@/lib/format";
import type {
  CategoriaProduto,
  Fornecedor,
  MovimentacaoComProduto,
  Produto,
  ProdutoComRelacoes,
} from "@/types/domain";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque — BP Info Gestão" },
      {
        name: "description",
        content:
          "Controle de produtos e peças, custo médio, reservas para OS, ajustes e histórico completo de movimentações.",
      },
      { property: "og:title", content: "Estoque — BP Info Gestão" },
      {
        property: "og:description",
        content:
          "Controle de produtos e peças, custo médio, reservas para OS, ajustes e histórico completo de movimentações.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EstoquePage,
});

const filtroLabels: Record<EstoqueFiltro, string> = {
  todos: "Todos",
  com_estoque: "Com estoque",
  sem_estoque: "Sem estoque",
  estoque_baixo: "Estoque baixo",
};

function situacaoEstoque(p: Produto) {
  const atual = Number(p.estoque_atual);
  if (!p.ativo) return { label: "Inativo", tone: "neutral" as const };
  if (atual <= 0) return { label: "Sem estoque", tone: "danger" as const };
  if (atual <= Number(p.estoque_minimo)) return { label: "Estoque baixo", tone: "warning" as const };
  return { label: "Disponível", tone: "success" as const };
}

function Produtos() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [categoriaId, setCategoriaId] = useState("todas");
  const [filtro, setFiltro] = useState<EstoqueFiltro>("todos");
  const [incluirInativos, setIncluirInativos] = useState(false);
  const [produtoDialog, setProdutoDialog] = useState<{ open: boolean; produto?: Produto | null }>({
    open: false,
  });
  const [entradaAberta, setEntradaAberta] = useState(false);
  const [ajusteAberto, setAjusteAberto] = useState(false);
  const [produtoAcao, setProdutoAcao] = useState<Produto | null>(null);

  const buscaDebounced = useDebounced(busca, 250);
  const params = {
    busca: buscaDebounced,
    categoriaId: categoriaId === "todas" ? undefined : categoriaId,
    filtro,
    incluirInativos,
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.produtos(params),
    queryFn: () => estoqueService.produtos(params),
  });
  const { data: categorias } = useQuery({
    queryKey: queryKeys.categoriasProduto,
    queryFn: estoqueService.categorias,
  });

  const produtos = (data ?? []) as ProdutoComRelacoes[];

  const alternarAtivo = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      estoqueService.alternarAtivo(id, ativo),
    onSuccess: async (_r, vars) => {
      await queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success(vars.ativo ? "Produto reativado." : "Produto inativado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resumo = useMemo(() => {
    const totalUnidades = produtos.reduce((s, p) => s + Number(p.estoque_atual), 0);
    const valorCusto = produtos.reduce(
      (s, p) => s + Number(p.estoque_atual) * Number(p.custo_medio),
      0,
    );
    const baixo = produtos.filter(
      (p) => Number(p.estoque_atual) > 0 && Number(p.estoque_atual) <= Number(p.estoque_minimo),
    );
    const zerado = produtos.filter((p) => Number(p.estoque_atual) <= 0);
    return { totalUnidades, valorCusto, baixo, zerado };
  }, [produtos]);

  const columns: DataTableColumn<ProdutoComRelacoes>[] = [
    {
      key: "codigo",
      header: "Código",
      cell: (p) => <span className="font-mono text-xs">{p.codigo}</span>,
    },
    {
      key: "nome",
      header: "Produto / peça",
      cell: (p) => (
        <div>
          <p className="font-medium">{p.nome}</p>
          {p.localizacao ? (
            <p className="text-xs text-muted-foreground">{p.localizacao}</p>
          ) : null}
        </div>
      ),
    },
    { key: "categoria", header: "Categoria", cell: (p) => p.categorias_produto?.nome ?? "—" },
    { key: "marca", header: "Marca", cell: (p) => p.marca || "—" },
    {
      key: "disponivel",
      header: "Disponível",
      className: "text-right",
      cell: (p) => numero(Number(p.estoque_atual) - Number(p.estoque_reservado)),
    },
    {
      key: "reservado",
      header: "Reservado",
      className: "text-right",
      cell: (p) => numero(p.estoque_reservado),
    },
    {
      key: "custo",
      header: "Custo médio",
      className: "text-right",
      cell: (p) => <Money value={p.custo_medio} />,
    },
    {
      key: "venda",
      header: "Venda",
      className: "text-right",
      cell: (p) => <Money value={p.preco_venda} />,
    },
    {
      key: "valor",
      header: "Valor em estoque",
      className: "text-right",
      cell: (p) => <Money value={Number(p.estoque_atual) * Number(p.custo_medio)} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (p) => <StatusBadge {...situacaoEstoque(p)} />,
    },
    {
      key: "acoes",
      header: "",
      className: "text-right",
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Registrar entrada"
            onClick={() => {
              setProdutoAcao(p);
              setEntradaAberta(true);
            }}
          >
            <PackagePlus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Ajustar estoque"
            onClick={() => {
              setProdutoAcao(p);
              setAjusteAberto(true);
            }}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Editar"
            onClick={() => setProdutoDialog({ open: true, produto: p })}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={p.ativo ? "Inativar" : "Reativar"}
            onClick={() => alternarAtivo.mutate({ id: p.id, ativo: !p.ativo })}
          >
            {p.ativo ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Itens cadastrados"
          value={numero(produtos.length)}
          icon={Package}
          loading={isLoading}
        />
        <MetricCard
          label="Unidades em estoque"
          value={numero(resumo.totalUnidades)}
          icon={Boxes}
          loading={isLoading}
        />
        <MetricCard
          label="Valor pelo custo"
          value={brl(resumo.valorCusto)}
          icon={DollarSign}
          loading={isLoading}
        />
        <MetricCard
          label="Estoque baixo"
          value={numero(resumo.baixo.length)}
          icon={AlertTriangle}
          loading={isLoading}
          hint={resumo.baixo
            .slice(0, 2)
            .map((p) => p.nome)
            .join(", ")}
        />
        <MetricCard
          label="Sem estoque"
          value={numero(resumo.zerado.length)}
          icon={Ban}
          loading={isLoading}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <SearchBar
            value={busca}
            onChange={setBusca}
            placeholder="Buscar por código, nome ou marca"
          />
          <Select value={categoriaId} onValueChange={setCategoriaId}>
            <SelectTrigger className="h-9 w-full sm:w-52">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {((categorias ?? []) as CategoriaProduto[]).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtro} onValueChange={(v) => setFiltro(v as EstoqueFiltro)}>
            <SelectTrigger className="h-9 w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(filtroLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch
              id="inativos"
              checked={incluirInativos}
              onCheckedChange={setIncluirInativos}
            />
            <Label htmlFor="inativos" className="text-xs text-muted-foreground">
              Mostrar inativos
            </Label>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={produtos}
        isLoading={isLoading}
        getRowKey={(p) => p.id}
        emptyIcon={Package}
        emptyTitle="Nenhum produto encontrado"
        emptyDescription="Cadastre peças e componentes para controlar custo médio, reservas e uso em OS."
      />

      <ProdutoDialog
        open={produtoDialog.open}
        onOpenChange={(open) => setProdutoDialog({ open, produto: produtoDialog.produto })}
        produto={produtoDialog.produto}
      />
      <EntradaDialog
        open={entradaAberta}
        onOpenChange={setEntradaAberta}
        produtoInicial={produtoAcao}
      />
      <AjusteDialog
        open={ajusteAberto}
        onOpenChange={setAjusteAberto}
        produtoInicial={produtoAcao}
      />
    </div>
  );
}

function Categorias() {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.categoriasProduto,
    queryFn: estoqueService.categorias,
  });
  const categorias = (data ?? []) as CategoriaProduto[];

  const criar = useMutation({
    mutationFn: () => estoqueService.criarCategoria(nome),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categoriasProduto });
      setNome("");
      toast.success("Categoria criada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <SearchBar value={nome} onChange={setNome} placeholder="Nome da nova categoria" />
        <Button disabled={!nome.trim() || criar.isPending} onClick={() => criar.mutate()}>
          <Plus className="size-4" /> Criar categoria
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton cols={2} />
      ) : categorias.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhuma categoria"
          description="Crie categorias livremente — memória, SSD, cabo, rede ou qualquer outra."
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categorias.map((c) => (
            <div key={c.id} className="surface-secondary">
              <p className="text-sm font-medium">{c.nome}</p>
              <p className="text-xs text-muted-foreground">{c.descricao || "Sem descrição"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const movimentacaoColumns: DataTableColumn<MovimentacaoComProduto>[] = [
  {
    key: "produto",
    header: "Produto",
    cell: (m) => (
      <div>
        <p className="font-medium">{m.produtos?.nome ?? "—"}</p>
        <p className="font-mono text-xs text-muted-foreground">{m.produtos?.codigo}</p>
      </div>
    ),
  },
  {
    key: "tipo",
    header: "Tipo",
    cell: (m) => <StatusBadge {...tipoMovimentacaoLabels[m.tipo]} />,
  },
  {
    key: "quantidade",
    header: "Qtde.",
    className: "text-right",
    cell: (m) => numero(m.quantidade),
  },
  {
    key: "custo",
    header: "Custo unit.",
    className: "text-right",
    cell: (m) => <Money value={m.custo_unitario} />,
  },
  {
    key: "saldo",
    header: "Saldo",
    className: "text-right",
    cell: (m) =>
      m.estoque_anterior === null && m.estoque_novo === null
        ? "—"
        : `${numero(m.estoque_anterior)} → ${numero(m.estoque_novo)}`,
  },
  { key: "os", header: "OS", cell: (m) => m.ordens_servico?.numero_os ?? "—" },
  {
    key: "motivo",
    header: "Motivo / obs.",
    cell: (m) => (
      <span className="text-xs text-muted-foreground">
        {m.motivo || m.observacoes || m.documento || "—"}
      </span>
    ),
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

function Movimentacoes() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.movimentacoes(),
    queryFn: () => estoqueService.movimentacoes(),
  });
  return (
    <DataTable
      columns={movimentacaoColumns}
      data={(data ?? []) as MovimentacaoComProduto[]}
      isLoading={isLoading}
      getRowKey={(m) => m.id}
      emptyIcon={ArrowDownUp}
      emptyTitle="Nenhuma movimentação"
      emptyDescription="Entradas, reservas, usos em OS, devoluções e ajustes ficam registrados aqui."
    />
  );
}

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
      emptyDescription="Cadastre fornecedores para vincular às entradas de compra."
    />
  );
}

function EstoquePage() {
  const [novoProduto, setNovoProduto] = useState(false);
  const [entrada, setEntrada] = useState(false);
  const [ajuste, setAjuste] = useState(false);

  return (
    <>
      <PageHeader
        title="Estoque"
        description="Peças, componentes e insumos utilizados nos atendimentos técnicos."
        actions={
          <>
            <Button variant="outline" onClick={() => setAjuste(true)}>
              <SlidersHorizontal className="size-4" /> Ajuste
            </Button>
            <Button variant="outline" onClick={() => setEntrada(true)}>
              <PackagePlus className="size-4" /> Registrar entrada
            </Button>
            <Button onClick={() => setNovoProduto(true)}>
              <Plus className="size-4" /> Novo produto
            </Button>
          </>
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

      <ProdutoDialog open={novoProduto} onOpenChange={setNovoProduto} />
      <EntradaDialog open={entrada} onOpenChange={setEntrada} />
      <AjusteDialog open={ajuste} onOpenChange={setAjuste} />
    </>
  );
}