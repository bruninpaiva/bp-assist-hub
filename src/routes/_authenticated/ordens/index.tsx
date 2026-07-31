import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  ordensService,
  configService,
  queryKeys,
  type OrdensPrioridade,
  type OrdensStatus,
} from "@/services/queries";
import { prioridadeLabels, statusOrdemServicoLabels, tipoEquipamentoLabels } from "@/lib/labels";
import { useDebounced } from "@/hooks/use-debounced";
import type { OSComRelacoes } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/ordens/")({
  head: () => ({
    meta: [
      { title: "Ordens de Serviço — BP Info Gestão" },
      {
        name: "description",
        content:
          "Abertura, acompanhamento, diagnóstico e histórico das ordens de serviço técnicas.",
      },
      { property: "og:title", content: "Ordens de Serviço — BP Info Gestão" },
      {
        property: "og:description",
        content:
          "Abertura, acompanhamento, diagnóstico e histórico das ordens de serviço técnicas.",
      },
    ],
  }),
  component: OrdensPage,
});

const PAGE_SIZE = 10;

function OrdensPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<OrdensStatus>("todos");
  const [prioridade, setPrioridade] = useState<OrdensPrioridade>("todos");
  const [tecnicoId, setTecnicoId] = useState<string>("todos");
  const [clienteId, setClienteId] = useState<string | undefined>(undefined);
  const [dataDe, setDataDe] = useState("");
  const [dataAte, setDataAte] = useState("");
  const [pagina, setPagina] = useState(1);
  const [excluindo, setExcluindo] = useState<OSComRelacoes | null>(null);

  const buscaDebounced = useDebounced(busca, 300);

  const { data: usuarios } = useQuery({
    queryKey: queryKeys.usuarios,
    queryFn: configService.usuarios,
  });

  const params = {
    busca: buscaDebounced,
    status,
    prioridade,
    tecnicoId: tecnicoId === "todos" ? undefined : tecnicoId,
    clienteId,
    dataDe: dataDe || undefined,
    dataAte: dataAte || undefined,
    pagina,
    porPagina: PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.ordens(params),
    queryFn: () => ordensService.list(params),
  });

  const ordens = (data?.data ?? []) as OSComRelacoes[];
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
      await ordensService.softDelete(excluindo.id);
      await queryClient.invalidateQueries({ queryKey: ["ordens"] });
      toast.success("Ordem de serviço excluída");
    } catch (error) {
      toast.error("Não foi possível excluir a ordem de serviço", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setExcluindo(null);
    }
  };

  const columns: DataTableColumn<OSComRelacoes>[] = [
    {
      key: "numero",
      header: "Nº",
      cell: (o) => (
        <Link
          to="/ordens/$id"
          params={{ id: o.id }}
          className="font-mono text-xs font-medium text-foreground hover:text-primary-glow hover:underline"
        >
          {o.numero_os}
        </Link>
      ),
    },
    { key: "cliente", header: "Cliente", cell: (o) => o.clientes?.nome ?? "—" },
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
      key: "prioridade",
      header: "Prioridade",
      cell: (o) => <StatusBadge {...prioridadeLabels[o.prioridade]} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (o) => <StatusBadge {...statusOrdemServicoLabels[o.status]} />,
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      cell: (o) => (
        <span className="font-semibold">
          <Money value={o.valor_total} />
        </span>
      ),
    },
    {
      key: "entrada",
      header: "Entrada",
      className: "text-right",
      cell: (o) => (
        <span className="text-sm text-muted-foreground">
          <DateDisplay value={o.data_entrada} />
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
              onClick={() => void navigate({ to: "/ordens/$id", params: { id: o.id } })}
            >
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void navigate({ to: "/ordens/$id/editar", params: { id: o.id } })}
            >
              Editar
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
        title="Ordens de Serviço"
        description="Toda manutenção acontece através de uma ordem de serviço, vinculada a cliente e equipamento."
        actions={
          <Button asChild>
            <Link to="/ordens/novo">
              <Plus className="size-4" /> Nova ordem de serviço
            </Link>
          </Button>
        }
      />

      <Section
        title="Ordens de serviço"
        actions={
          <SearchBar
            value={busca}
            onChange={resetPaginaEAtualiza(setBusca)}
            placeholder="Buscar por nº, cliente, equipamento ou série"
            className="sm:w-96"
          />
        }
      >
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <Select
            value={status}
            onValueChange={(v) => resetPaginaEAtualiza(setStatus)(v as OrdensStatus)}
          >
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {Object.entries(statusOrdemServicoLabels).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={prioridade}
            onValueChange={(v) => resetPaginaEAtualiza(setPrioridade)(v as OrdensPrioridade)}
          >
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Toda prioridade</SelectItem>
              {Object.entries(prioridadeLabels).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tecnicoId} onValueChange={resetPaginaEAtualiza(setTecnicoId)}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Técnico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo técnico</SelectItem>
              {(usuarios ?? []).map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome || u.email}
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

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">De</Label>
            <Input
              type="date"
              className="h-9 w-36"
              value={dataDe}
              onChange={(e) => resetPaginaEAtualiza(setDataDe)(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Até</Label>
            <Input
              type="date"
              className="h-9 w-36"
              value={dataAte}
              onChange={(e) => resetPaginaEAtualiza(setDataAte)(e.target.value)}
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
          data={ordens}
          isLoading={isLoading}
          getRowKey={(o) => o.id}
          emptyIcon={Wrench}
          emptyTitle="Nenhuma ordem de serviço encontrada"
          emptyDescription="Ajuste a busca ou os filtros, ou abra uma nova ordem de serviço."
        />

        {!isLoading && total > PAGE_SIZE ? (
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              {total} ordem{total === 1 ? "" : "s"} de serviço · página {pagina} de {totalPaginas}
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
        title="Excluir ordem de serviço"
        description={`Tem certeza que deseja excluir a OS "${excluindo?.numero_os}"? Ela deixará de aparecer nas listagens, mas o histórico é preservado.`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => void handleExcluir()}
      />
    </>
  );
}
