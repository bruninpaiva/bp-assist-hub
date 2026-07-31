import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { HardDrive, MoreHorizontal, Plus } from "lucide-react";
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
  equipamentosService,
  queryKeys,
  type EquipamentosStatus,
  type EquipamentosTipo,
} from "@/services/queries";
import { statusEquipamentoLabels, tipoEquipamentoLabels } from "@/lib/labels";
import { useDebounced } from "@/hooks/use-debounced";
import type { Equipamento } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/equipamentos/")({
  head: () => ({
    meta: [
      { title: "Equipamentos — BP Info Gestão" },
      {
        name: "description",
        content: "Cadastro e acompanhamento técnico de notebooks, desktops e demais equipamentos.",
      },
      { property: "og:title", content: "Equipamentos — BP Info Gestão" },
      {
        property: "og:description",
        content: "Cadastro e acompanhamento técnico de notebooks, desktops e demais equipamentos.",
      },
    ],
  }),
  component: EquipamentosPage,
});

type EquipamentoRow = Equipamento & { clientes?: { nome: string } | null };

const PAGE_SIZE = 10;

function EquipamentosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<EquipamentosTipo>("todos");
  const [status, setStatus] = useState<EquipamentosStatus>("todos");
  const [pagina, setPagina] = useState(1);
  const [excluindo, setExcluindo] = useState<EquipamentoRow | null>(null);

  const buscaDebounced = useDebounced(busca, 300);

  const params = {
    busca: buscaDebounced,
    tipo,
    status,
    pagina,
    porPagina: PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.equipamentos(params),
    queryFn: () => equipamentosService.list(params),
  });

  const equipamentos = (data?.data ?? []) as EquipamentoRow[];
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
      await equipamentosService.softDelete(excluindo.id);
      await queryClient.invalidateQueries({ queryKey: ["equipamentos"] });
      toast.success("Equipamento excluído");
    } catch (error) {
      toast.error("Não foi possível excluir o equipamento", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setExcluindo(null);
    }
  };

  const columns: DataTableColumn<EquipamentoRow>[] = [
    {
      key: "equipamento",
      header: "Equipamento",
      cell: (e) => (
        <Link
          to="/equipamentos/$id"
          params={{ id: e.id }}
          className="font-medium text-foreground hover:text-primary-glow hover:underline"
        >
          {[e.marca, e.modelo].filter(Boolean).join(" ") || tipoEquipamentoLabels[e.tipo]}
        </Link>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (e) => <StatusBadge label={tipoEquipamentoLabels[e.tipo]} tone="info" />,
    },
    {
      key: "serie",
      header: "Série / Patrimônio",
      cell: (e) => (
        <span className="font-mono text-xs">{e.numero_serie || e.patrimonio || "—"}</span>
      ),
    },
    { key: "cliente", header: "Cliente", cell: (e) => e.clientes?.nome ?? "—" },
    {
      key: "status",
      header: "Status",
      cell: (e) => <StatusBadge {...statusEquipamentoLabels[e.status]} />,
    },
    {
      key: "entrada",
      header: "Entrada",
      className: "text-right",
      cell: (e) => (
        <span className="text-sm text-muted-foreground">
          <DateDisplay value={e.data_entrada} />
        </span>
      ),
    },
    {
      key: "acoes",
      header: "",
      className: "text-right",
      cell: (e) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Ações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => void navigate({ to: "/equipamentos/$id", params: { id: e.id } })}
            >
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                void navigate({ to: "/equipamentos/$id/editar", params: { id: e.id } })
              }
            >
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setExcluindo(e)}
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
        title="Equipamentos"
        description="Histórico técnico de cada equipamento: série, patrimônio, defeito informado e diagnóstico."
        actions={
          <Button asChild>
            <Link to="/equipamentos/novo">
              <Plus className="size-4" /> Novo equipamento
            </Link>
          </Button>
        }
      />

      <Section
        title="Equipamentos cadastrados"
        actions={
          <SearchBar
            value={busca}
            onChange={resetPaginaEAtualiza(setBusca)}
            placeholder="Buscar por série, cliente, marca, modelo ou patrimônio"
            className="sm:w-96"
          />
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Select
            value={tipo}
            onValueChange={(v) => resetPaginaEAtualiza(setTipo)(v as EquipamentosTipo)}
          >
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {Object.entries(tipoEquipamentoLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(v) => resetPaginaEAtualiza(setStatus)(v as EquipamentosStatus)}
          >
            <SelectTrigger className="h-9 w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {Object.entries(statusEquipamentoLabels).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={equipamentos}
          isLoading={isLoading}
          getRowKey={(e) => e.id}
          emptyIcon={HardDrive}
          emptyTitle="Nenhum equipamento encontrado"
          emptyDescription="Ajuste a busca ou os filtros, ou cadastre um novo equipamento."
        />

        {!isLoading && total > PAGE_SIZE ? (
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              {total} equipamento{total === 1 ? "" : "s"} · página {pagina} de {totalPaginas}
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
        title="Excluir equipamento"
        description={`Tem certeza que deseja excluir "${[excluindo?.marca, excluindo?.modelo].filter(Boolean).join(" ") || "este equipamento"}"? Ele deixará de aparecer nas listagens, mas o histórico é preservado.`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => void handleExcluir()}
      />
    </>
  );
}
