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
import { HardDrive, Plus } from "lucide-react";
import { equipamentosService, queryKeys } from "@/services/queries";
import { tipoEquipamentoLabels } from "@/lib/labels";
import type { Equipamento } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/equipamentos")({
  head: () => ({
    meta: [
      { title: "Equipamentos — BP Info Gestão" },
      { name: "description", content: "Cadastro de notebooks, desktops, servidores, impressoras e demais equipamentos por cliente." },
      { property: "og:title", content: "Equipamentos — BP Info Gestão" },
      { property: "og:description", content: "Cadastro de notebooks, desktops, servidores, impressoras e demais equipamentos por cliente." },
    ],
  }),
  component: EquipamentosPage,
});

type EquipamentoRow = Equipamento & { clientes?: { nome: string } | null };

function EquipamentosPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.equipamentos,
    queryFn: equipamentosService.list,
  });
  const equipamentos = (data ?? []) as EquipamentoRow[];

  return (
    <>
      <PageHeader
        title="Equipamentos"
        description="Histórico técnico de cada equipamento: série, patrimônio, defeito informado e acessórios."
        actions={
          <Button onClick={() => toast.info("Cadastro de equipamentos chega no próximo módulo.")}>
            <Plus className="size-4" /> Novo equipamento
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {Object.entries(tipoEquipamentoLabels).slice(0, 5).map(([key, label]) => (
          <Card key={key} className="surface-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-bold">
              {equipamentos.filter((e) => e.tipo === key).length}
            </p>
          </Card>
        ))}
      </div>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-base">Equipamentos cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton cols={5} />
          ) : equipamentos.length === 0 ? (
            <EmptyState
              icon={HardDrive}
              title="Nenhum equipamento cadastrado"
              description="Vincule equipamentos aos clientes para acompanhar todo o histórico de manutenções."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Série / Patrimônio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Defeito informado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipamentos.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      {[e.marca, e.modelo].filter(Boolean).join(" ") || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={tipoEquipamentoLabels[e.tipo]} tone="info" />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {e.numero_serie || e.patrimonio || "—"}
                    </TableCell>
                    <TableCell>{e.clientes?.nome ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {e.defeito_informado || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
