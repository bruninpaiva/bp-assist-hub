import { useState } from "react";
import { useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ClienteCombobox } from "@/components/common/ClienteCombobox";
import { equipamentosService, queryKeys } from "@/services/queries";
import { tipoEquipamentoLabels } from "@/lib/labels";
import { EquipamentoForm } from "../../equipamentos/-components/EquipamentoForm";
import { defaultEquipamentoFormValues } from "../../equipamentos/-lib/schema";
import type { ChecklistItem, Equipamento } from "@/types/domain";
import type { OrdemServicoFormValues } from "../-lib/schema";

export function ClienteEquipamentoFields({
  control,
  setValue,
}: {
  control: Control<OrdemServicoFormValues>;
  setValue: UseFormSetValue<OrdemServicoFormValues>;
}) {
  const queryClient = useQueryClient();
  const [novoEquipamentoAberto, setNovoEquipamentoAberto] = useState(false);

  const clienteId = useWatch({ control, name: "cliente_id" });
  const clienteNome = useWatch({ control, name: "cliente_nome" });

  const { data: equipamentosData, isLoading: carregandoEquipamentos } = useQuery({
    queryKey: queryKeys.equipamentos({ clienteId, porPagina: 100 }),
    queryFn: () => equipamentosService.list({ clienteId, porPagina: 100 }),
    enabled: Boolean(clienteId),
  });
  const equipamentos = (equipamentosData?.data ?? []) as Equipamento[];

  const { data: checklistItens } = useQuery({
    queryKey: queryKeys.checklistItens,
    queryFn: equipamentosService.listChecklistItens,
    enabled: novoEquipamentoAberto,
  });

  return (
    <>
      <FormField
        control={control}
        name="cliente_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cliente</FormLabel>
            <FormControl>
              <ClienteCombobox
                value={field.value}
                label={clienteNome}
                onChange={(id, nome) => {
                  field.onChange(id);
                  setValue("cliente_nome", nome);
                  setValue("equipamento_id", "");
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="equipamento_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center justify-between gap-2">
              Equipamento
              {clienteId ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs font-normal text-primary-glow"
                  onClick={() => setNovoEquipamentoAberto(true)}
                >
                  <Plus className="size-3.5" /> Novo equipamento
                </Button>
              ) : null}
            </FormLabel>
            <Select value={field.value} onValueChange={field.onChange} disabled={!clienteId}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      clienteId ? "Selecione um equipamento" : "Selecione um cliente primeiro"
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {equipamentos.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {[e.marca, e.modelo].filter(Boolean).join(" ") || tipoEquipamentoLabels[e.tipo]}
                    {e.numero_serie ? ` — ${e.numero_serie}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clienteId && !carregandoEquipamentos && equipamentos.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Este cliente ainda não tem equipamentos cadastrados. Use "Novo equipamento" para
                cadastrar sem sair desta tela.
              </p>
            ) : null}
            <FormMessage />
          </FormItem>
        )}
      />

      <Dialog open={novoEquipamentoAberto} onOpenChange={setNovoEquipamentoAberto}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo equipamento</DialogTitle>
            <DialogDescription>
              Cadastre um equipamento para {clienteNome || "o cliente selecionado"} sem sair desta
              tela.
            </DialogDescription>
          </DialogHeader>
          <EquipamentoForm
            defaultValues={{
              ...defaultEquipamentoFormValues((checklistItens ?? []) as ChecklistItem[]),
              cliente_id: clienteId,
            }}
            onCancel={() => setNovoEquipamentoAberto(false)}
            onSaved={(equipamento) => {
              setValue("equipamento_id", equipamento.id, { shouldValidate: true });
              setNovoEquipamentoAberto(false);
              void queryClient.invalidateQueries({ queryKey: ["equipamentos"] });
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
