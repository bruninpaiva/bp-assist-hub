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
import { Plus, Wrench } from "lucide-react";
import { ordensService, queryKeys } from "@/services/queries";
import { prioridadeLabels, statusOSLabels } from "@/lib/labels";
import { brl, dataCurta } from "@/lib/format";
import { ultimasOS } from "@/components/dashboard/mock-data";
import type { OrdemServico } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/ordens")({
  head: () => ({
    meta: [
      { title: "Ordens de Serviço — BP Info Gestão" },
      { name: "description", content: "Abertura, acompanhamento, timeline e histórico das ordens de serviço técnicas." },
      { property: "og:title", content: "Ordens de Serviço — BP Info Gestão" },
      { property: "og:description", content: "Abertura, acompanhamento, timeline e histórico das ordens de serviço técnicas." },
    ],
  }),
  component: OrdensPage,
});

type OSRow = OrdemServico & { clientes?: { nome: string } | null };

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
            <p className="mt-2 text-xl font-bold">
              {ordens.filter((o) => o.status === s).length}
            </p>
          </Card>
        ))}
      </div>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-base">Ordens registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton cols={6} />
          ) : ordens.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="Nenhuma ordem de serviço"
              description="Quando as OS forem abertas, elas aparecerão aqui com status, prioridade e timeline."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Entrada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordens.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">
                      #{String(o.numero).padStart(4, "0")}
                    </TableCell>
                    <TableCell>{o.clientes?.nome ?? "—"}</TableCell>
                    <TableCell className="font-medium">{o.titulo}</TableCell>
                    <TableCell>
                      <StatusBadge {...prioridadeLabels[o.prioridade]} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge {...statusOSLabels[o.status]} />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {dataCurta(o.data_entrada)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-base">Exemplo de timeline (demonstração)</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-5 border-l border-border pl-6">
            {ultimasOS.map((os) => (
              <li key={os.numero} className="relative">
                <span className="absolute top-1.5 -left-[27px] size-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
                <p className="text-sm font-medium">
                  OS #{String(os.numero).padStart(4, "0")} — {os.equipamento}
                </p>
                <p className="text-xs text-muted-foreground">
                  {os.cliente} · {statusOSLabels[os.status].label} · {brl(os.valor)}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </>
  );
}
