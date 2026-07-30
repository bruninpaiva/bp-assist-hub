import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateDisplay } from "@/components/common/DateDisplay";
import { InfoCard } from "@/components/cards/InfoCard";
import { TableSkeleton } from "@/components/tables/TableSkeleton";
import { toast } from "sonner";
import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { agendaService, queryKeys } from "@/services/queries";
import { tipoAgendaLabels } from "@/lib/labels";
import type { AgendaEvento } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — BP Info Gestão" },
      {
        name: "description",
        content: "Calendário de visitas técnicas, retiradas, entregas e compromissos da equipe.",
      },
      { property: "og:title", content: "Agenda — BP Info Gestão" },
      {
        property: "og:description",
        content: "Calendário de visitas técnicas, retiradas, entregas e compromissos da equipe.",
      },
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

        <Section title="Compromissos" contentClassName="space-y-2">
          {isLoading ? (
            <TableSkeleton cols={3} />
          ) : eventos.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Agenda vazia"
              description="Visitas, retiradas e entregas agendadas aparecerão aqui organizadas por data."
            />
          ) : (
            eventos.map((ev) => (
              <InfoCard
                key={ev.id}
                leading={<StatusBadge label={tipoAgendaLabels[ev.tipo]} tone="primary" />}
                title={ev.titulo}
                meta={
                  <span className="text-xs text-muted-foreground">
                    <DateDisplay value={ev.inicio} mode="full" />
                  </span>
                }
              />
            ))
          )}
        </Section>
      </div>
    </>
  );
}
