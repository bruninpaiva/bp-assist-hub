import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, FileText, MoreHorizontal, Plus } from "lucide-react";
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
import { Money } from "@/components/common/Money";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ClienteCombobox } from "@/components/common/ClienteCombobox";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { orcamentosService, queryKeys, type OrcamentosStatus } from "@/services/queries";
import { statusOrcamentoLabels, tipoEquipamentoLabels } from "@/lib/labels";
import { useDebounced } from "@/hooks/use-debounced";
import type { OrcamentoComRelacoes } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/orcamentos/")({
  head: () => ({
    meta: [
      { title: "Orçamentos — BP Info Gestão" },
      {
        name: "description",
        content: "Criação, envio e acompanhamento de orçamentos vinculados às ordens de serviço.",
      },
      { property: "og:title", content: "Orçamentos — BP Info Gestão" },
      {
        property: "og:description",
        content: "Criação, envio e acompanhamento de orçamentos vinculados às ordens de serviço.",
      },
    ],
  }),
  component: OrcamentosPage,
});

const PAGE_SIZE = 10;

function OrcamentosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<OrcamentosStatus>("todos");
  const [clienteId, setClienteId] = useState<string | undefined>(undefined);
  const [pagina, setPagina] = useState(1);
  const [excluindo, setExcluindo] = useState<OrcamentoComRelacoes | null>(null);

  const buscaDebounced = useDebounced(busca, 300);

  const params = {
    busca: buscaDebounced,
    status,
    clienteId,
    pagina,
    porPagina: PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.orcamentos(params),
    queryFn: () => orcamentosService.list(params),
  });

  const orcamentos = (data?.data ?? []) as OrcamentoComRelacoes[];
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const resetPaginaEAtualiza =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setPagina(1);
      setter(value);
    };

  const handleDuplicar = async (o: OrcamentoComRelacoes) => {
    try {
      const novo = await orcamentosService.duplicar(o.id);
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
    if (!excluindo) return;
    try {
      await orcamentosService.softDelete(excluindo.id);
      await queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast.success("Orçamento excluído");
    } catch (error) {
      toast.error("Não foi possível excluir o orçamento", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setExcluindo(null);
    }
  };

  const columns: DataTableColumn<OrcamentoComRelacoes>[] = [
    {
      key: "numero",
      header: "Número",
      cell: (o) => (
        <Link
          to="/orcamentos/$id"
          params={{ id: o.id }}
          className="font-mono text-xs font-medium text-foreground hover:text-primary-glow hover:underline"
        >
          {o.numero}/{o.ano}
        </Link>
      ),
    },
    { key: "cliente", header: "Cliente", cell: (o) => o.clientes?.nome ?? "—" },
    { key: "os", header: "OS", cell: (o) => o.ordens_servico?.numero_os ?? "—" },
    {
      key: "equipamento",
      header: "Equipamento",
      cell: (o) =>
        o.equipamentos
          ? [o.equipamentos.marca, o.equipamentos.modelo].filter(Boolean).join(" ") ||
            tipoEquipamentoLabels[o.equipamentos.tipo]
          : "—",
    },
    {
      key: "status",
      header: "Status",
      cell: (o) => <StatusBadge {...statusOrcamentoLabels[o.status]} />,
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      cell: (o) => (
        <span className="font-semibold">
          <Money value={o.total} />
        </span>
      ),
    },
    {
      key: "emissao",
      header: "Emissão",
      className: "text-right",
      cell: (o) => (
        <span className="text-sm text-muted-foreground">
          <DateDisplay value={o.data_emissao} />
        </span>
      ),
    },
    {
      key: "acoes",
      header: "",
      className: "text-right",
      cell: (o) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Ações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => void navigate({ to: "/orcamentos/$id", params: { id: o.id } })}
            >
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void navigate({ to: "/orcamentos/$id/editar", params: { id: o.id } })}
            >
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleDuplicar(o)}>
              <Copy className="size-4" /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setExcluindo(o)}
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
        title="Orçamentos"
        description="Todo orçamento é vinculado a uma ordem de serviço, com histórico de status e itens detalhados."
        actions={
          <Button asChild>
            <Link to="/orcamentos/novo">
              <Plus className="size-4" /> Novo orçamento
            </Link>
          </Button>
        }
      />

      <Section
        title="Orçamentos"
        actions={
          <SearchBar
            value={busca}
            onChange={resetPaginaEAtualiza(setBusca)}
            placeholder="Buscar por número, cliente ou OS"
            className="sm:w-96"
          />
        }
      >
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <Select
            value={status}
            onValueChange={(v) => resetPaginaEAtualiza(setStatus)(v as OrcamentosStatus)}
          >
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {Object.entries(statusOrcamentoLabels).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-56">
            <ClienteCombobox
              value={clienteId}
              placeholder="Todo cliente"
              onChange={(id) => resetPaginaEAtualiza(setClienteId)(id)}
            />
          </div>

          {clienteId ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => resetPaginaEAtualiza(setClienteId)(undefined)}
            >
              Limpar cliente
            </Button>
          ) : null}
        </div>

        <DataTable
          columns={columns}
          data={orcamentos}
          isLoading={isLoading}
          getRowKey={(o) => o.id}
          emptyIcon={FileText}
          emptyTitle="Nenhum orçamento encontrado"
          emptyDescription="Ajuste a busca ou os filtros, ou crie um novo orçamento."
        />

        {!isLoading && total > PAGE_SIZE ? (
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              {total} orçamento{total === 1 ? "" : "s"} · página {pagina} de {totalPaginas}
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
        title="Excluir orçamento"
        description={`Tem certeza que deseja excluir o orçamento nº ${excluindo?.numero}/${excluindo?.ano}? Ele deixará de aparecer nas listagens, mas o histórico é preservado.`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => void handleExcluir()}
      />
    </>
  );
}
