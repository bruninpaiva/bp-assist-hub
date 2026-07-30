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
import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { agendaService, queryKeys } from "@/services/queries";
import { tipoAgendaLabels } from "@/lib/labels";
import { dataHora } from "@/lib/format";
import type { AgendaEvento } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — BP Info Gestão" },
      { name: "description", content: "Calendário de visitas técnicas, retiradas, entregas e compromissos da equipe." },
      { property: "og:title", content: "Agenda — BP Info Gestão" },
      { property: "og:description", content: "Calendário de visitas técnicas, retiradas, entregas e compromissos da equipe." },
    ],
  }),
  component: AgendaPage,
});

function AgendaPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.agenda,
    queryFn: agendaService.list,
  });
  const eventos = (data ?? []) as AgendaEvento[];

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Planejamento de visitas, retiradas, entregas e manutenções programadas."
        actions={
          <Button onClick={() => toast.info("Criação de compromissos chega no próximo módulo.")}>
            <Plus className="size-4" /> Novo compromisso
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <Card className="surface-card p-3">
          <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-lg" />
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="text-base">Compromissos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton cols={3} />
            ) : eventos.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Agenda vazia"
                description="Visitas, retiradas e entregas agendadas aparecerão aqui organizadas por data."
              />
            ) : (
              <div className="space-y-2">
                {eventos.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 px-3.5 py-3"
                  >
                    <StatusBadge label={tipoAgendaLabels[ev.tipo]} tone="primary" />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{ev.titulo}</p>
                    <span className="text-xs text-muted-foreground">{dataHora(ev.inicio)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
