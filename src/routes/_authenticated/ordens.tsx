import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateDisplay } from "@/components/common/DateDisplay";
import { Money } from "@/components/common/Money";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { toast } from "sonner";
import { Plus, Wrench } from "lucide-react";
import { ordensService, queryKeys } from "@/services/queries";
import { prioridadeLabels, statusOSLabels } from "@/lib/labels";
import { ultimasOS } from "@/components/dashboard/mock-data";
import type { OrdemServico } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/ordens")({
  head: () => ({
    meta: [
      { title: "Ordens de Serviço — BP Info Gestão" },
      {
        name: "description",
        content: "Abertura, acompanhamento, timeline e histórico das ordens de serviço técnicas.",
      },
      { property: "og:title", content: "Ordens de Serviço — BP Info Gestão" },
      {
        property: "og:description",
        content: "Abertura, acompanhamento, timeline e histórico das ordens de serviço técnicas.",
      },
    ],
  }),
  component: OrdensPage,
});

type OSRow = OrdemServico & { clientes?: { nome: string } | null };

const columns: DataTableColumn<OSRow>[] = [
  {
    key: "numero",
    header: "Nº",
    cell: (o) => <span className="font-mono text-xs">#{String(o.numero).padStart(4, "0")}</span>,
  },
  { key: "cliente", header: "Cliente", cell: (o) => o.clientes?.nome ?? "—" },
  { key: "titulo", header: "Título", cell: (o) => <span className="font-medium">{o.titulo}</span> },
  {
    key: "prioridade",
    header: "Prioridade",
    cell: (o) => <StatusBadge {...prioridadeLabels[o.prioridade]} />,
  },
  { key: "status", header: "Status", cell: (o) => <StatusBadge {...statusOSLabels[o.status]} /> },
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
];

function OrdensPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.ordens,
    queryFn: ordensService.list,
  });
  const ordens = (data ?? []) as OSRow[];

  return (
    <>
      <PageHeader
        title="Ordens de Serviço"
        description="Fluxo completo do atendimento técnico: entrada, diagnóstico, execução e entrega."
        actions={
          <Button onClick={() => toast.info("Abertura de OS chega no próximo módulo.")}>
            <Plus className="size-4" /> Abrir OS
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(["aberta", "em_execucao", "aguardando_peca", "entregue"] as const).map((s) => (
          <Card key={s} className="surface-card p-4">
            <StatusBadge {...statusOSLabels[s]} />
            <p className="mt-2 text-xl font-bold">{ordens.filter((o) => o.status === s).length}</p>
          </Card>
        ))}
      </div>

      <Section title="Ordens registradas">
        <DataTable
          columns={columns}
          data={ordens}
          isLoading={isLoading}
          getRowKey={(o) => o.id}
          emptyIcon={Wrench}
          emptyTitle="Nenhuma ordem de serviço"
          emptyDescription="Quando as OS forem abertas, elas aparecerão aqui com status, prioridade e timeline."
        />
      </Section>

      <Section title="Exemplo de timeline (demonstração)">
        <ol className="relative space-y-5 border-l border-border pl-6">
          {ultimasOS.map((os) => (
            <li key={os.numero} className="relative">
              <span className="absolute top-1.5 -left-[27px] size-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
              <p className="text-sm font-medium">
                OS #{String(os.numero).padStart(4, "0")} — {os.equipamento}
              </p>
              <p className="text-xs text-muted-foreground">
                {os.cliente} · {statusOSLabels[os.status].label} · <Money value={os.valor} />
              </p>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
