import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { SearchBar } from "@/components/common/SearchBar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateDisplay } from "@/components/common/DateDisplay";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import {
  clientesService,
  queryKeys,
  type ClientesOrdenarPor,
  type ClientesStatus,
  type ClientesTipo,
} from "@/services/queries";
import { maskDocumento } from "@/lib/masks";
import { tipoPessoaLabels } from "@/lib/labels";
import type { Cliente } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/clientes/")({
  head: () => ({
    meta: [
      { title: "Clientes — BP Info Gestão" },
      {
        name: "description",
        content:
          "Cadastro de clientes pessoa física e jurídica com contatos, documentos e endereço.",
      },
      { property: "og:title", content: "Clientes — BP Info Gestão" },
      {
        property: "og:description",
        content:
          "Cadastro de clientes pessoa física e jurídica com contatos, documentos e endereço.",
      },
    ],
  }),
  component: ClientesPage,
});

const PAGE_SIZE = 10;

const ORDENACAO_OPTIONS: {
  value: string;
  label: string;
  ordenarPor: ClientesOrdenarPor;
  ordem: "asc" | "desc";
}[] = [
  { value: "recentes", label: "Mais recentes", ordenarPor: "created_at", ordem: "desc" },
  { value: "antigos", label: "Mais antigos", ordenarPor: "created_at", ordem: "asc" },
  { value: "nome_asc", label: "Nome A-Z", ordenarPor: "nome", ordem: "asc" },
  { value: "nome_desc", label: "Nome Z-A", ordenarPor: "nome", ordem: "desc" },
];

function useDebounced<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function ClientesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<ClientesTipo>("todos");
  const [status, setStatus] = useState<ClientesStatus>("todos");
  const [ordenacao, setOrdenacao] = useState("recentes");
  const [pagina, setPagina] = useState(1);
  const [excluindo, setExcluindo] = useState<Cliente | null>(null);

  const buscaDebounced = useDebounced(busca, 300);
  const ordem = ORDENACAO_OPTIONS.find((o) => o.value === ordenacao) ?? ORDENACAO_OPTIONS[0];

  const params = {
    busca: buscaDebounced,
    tipo,
    status,
    ordenarPor: ordem.ordenarPor,
    ordem: ordem.ordem,
    pagina,
    porPagina: PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.clientes(params),
    queryFn: () => clientesService.list(params),
  });

  const clientes = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const resetPaginaEAtualiza =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setPagina(1);
      setter(value);
    };

  const handleExcluir = async () => {
    if (!excluindo) return;
    try {
      await clientesService.softDelete(excluindo.id);
      await queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente excluído");
    } catch (error) {
      toast.error("Não foi possível excluir o cliente", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setExcluindo(null);
    }
  };

  const columns: DataTableColumn<Cliente>[] = [
    {
      key: "nome",
      header: "Nome",
      cell: (c) => (
        <Link
          to="/clientes/$id"
          params={{ id: c.id }}
          className="font-medium text-foreground hover:text-primary-glow hover:underline"
        >
          {c.nome}
        </Link>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (c) => (
        <StatusBadge
          label={tipoPessoaLabels[c.tipo_pessoa]}
          tone={c.tipo_pessoa === "juridica" ? "primary" : "info"}
        />
      ),
    },
    {
      key: "documento",
      header: "Documento",
      cell: (c) => (
        <span className="font-mono text-xs">
          {c.cnpj ? maskDocumento(c.cnpj) : c.cpf ? maskDocumento(c.cpf) : "—"}
        </span>
      ),
    },
    {
      key: "contato",
      header: "Contato",
      cell: (c) => (
        <span className="text-sm text-muted-foreground">
          {c.whatsapp || c.telefone || c.email || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (c) => (
        <StatusBadge label={c.ativo ? "Ativo" : "Inativo"} tone={c.ativo ? "success" : "neutral"} />
      ),
    },
    {
      key: "cadastro",
      header: "Cadastro",
      className: "text-right",
      cell: (c) => (
        <span className="text-sm text-muted-foreground">
          <DateDisplay value={c.created_at} />
        </span>
      ),
    },
    {
      key: "acoes",
      header: "",
      className: "text-right",
      cell: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Ações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => void navigate({ to: "/clientes/$id", params: { id: c.id } })}
            >
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void navigate({ to: "/clientes/$id/editar", params: { id: c.id } })}
            >
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setExcluindo(c)}
              className="text-destructive focus:text-destructive"
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Base de clientes da assistência técnica, com dados de contato e histórico."
        actions={
          <Button asChild>
            <Link to="/clientes/novo">
              <Plus className="size-4" /> Novo cliente
            </Link>
          </Button>
        }
      />

      <Section
        title="Lista de clientes"
        actions={
          <SearchBar
            value={busca}
            onChange={resetPaginaEAtualiza(setBusca)}
            placeholder="Buscar por nome, CPF, CNPJ, telefone ou e-mail"
            className="sm:w-96"
          />
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Select
            value={tipo}
            onValueChange={(v) => resetPaginaEAtualiza(setTipo)(v as ClientesTipo)}
          >
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="fisica">Pessoa Física</SelectItem>
              <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(v) => resetPaginaEAtualiza(setStatus)(v as ClientesStatus)}
          >
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="inativos">Inativos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ordenacao} onValueChange={resetPaginaEAtualiza(setOrdenacao)}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {ORDENACAO_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={clientes}
          isLoading={isLoading}
          getRowKey={(c) => c.id}
          emptyIcon={Users}
          emptyTitle="Nenhum cliente encontrado"
          emptyDescription="Ajuste a busca ou os filtros, ou cadastre um novo cliente."
        />

        {!isLoading && total > PAGE_SIZE ? (
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              {total} cliente{total === 1 ? "" : "s"} · página {pagina} de {totalPaginas}
            </p>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagina > 1) setPagina(pagina - 1);
                    }}
                    className={pagina <= 1 ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagina < totalPaginas) setPagina(pagina + 1);
                    }}
                    className={
                      pagina >= totalPaginas ? "pointer-events-none opacity-50" : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}
      </Section>

      <ConfirmDialog
        open={excluindo !== null}
        onOpenChange={(open) => !open && setExcluindo(null)}
        title="Excluir cliente"
        description={`Tem certeza que deseja excluir "${excluindo?.nome}"? O cliente deixará de aparecer nas listagens, mas o histórico é preservado.`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => void handleExcluir()}
      />
    </>
  );
}
