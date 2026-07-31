import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ClienteCombobox } from "@/components/common/ClienteCombobox";
import { LoadingState } from "@/components/common/LoadingState";
import { FormSection } from "@/components/forms/FormSection";
import { equipamentosService } from "@/services/queries";
import { tipoEquipamentoLabels, statusEquipamentoLabels } from "@/lib/labels";
import {
  equipamentoSchema,
  toEquipamentoPayload,
  type EquipamentoFormValues,
} from "../-lib/schema";
import { ChecklistFields } from "./ChecklistFields";
import type { Equipamento } from "@/types/domain";

export function EquipamentoForm({
  equipamentoId,
  defaultValues,
  onCancel,
  onSaved,
}: {
  equipamentoId?: string;
  defaultValues: EquipamentoFormValues;
  onCancel: () => void;
  onSaved: (equipamento: Equipamento) => void;
}) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EquipamentoFormValues>({
    resolver: zodResolver(equipamentoSchema),
    defaultValues,
  });

  const onSubmit = async (values: EquipamentoFormValues) => {
    setSubmitting(true);
    try {
      const payload = toEquipamentoPayload(values);
      const equipamento = equipamentoId
        ? await equipamentosService.update(equipamentoId, payload)
        : await equipamentosService.create(payload);

      await equipamentosService.salvarChecklist(
        equipamento.id,
        values.checklist.map((c) => ({
          item_id: c.item_id,
          presente: c.presente,
          observacao: c.observacao?.trim() ? c.observacao.trim() : null,
        })),
      );

      await queryClient.invalidateQueries({ queryKey: ["equipamentos"] });
      toast.success(equipamentoId ? "Equipamento atualizado" : "Equipamento cadastrado");
      onSaved(equipamento);
    } catch (error) {
      toast.error("Não foi possível salvar o equipamento", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Cliente e equipamento">
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="cliente_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <FormControl>
                    <ClienteCombobox
                      value={field.value}
                      label={form.watch("cliente_nome")}
                      onChange={(id, nome) => {
                        field.onChange(id);
                        form.setValue("cliente_nome", nome);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(tipoEquipamentoLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(statusEquipamentoLabels).map(([value, { label }]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="marca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <Input placeholder="Dell, HP, Lenovo..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="modelo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numero_serie"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de série</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="patrimonio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patrimônio</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Dados técnicos">
          <FormField
            control={form.control}
            name="processador"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Processador</FormLabel>
                <FormControl>
                  <Input placeholder="Intel i5 10ª geração" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="memoria_ram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Memória RAM</FormLabel>
                <FormControl>
                  <Input placeholder="8GB DDR4" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="armazenamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Armazenamento</FormLabel>
                <FormControl>
                  <Input placeholder="SSD 256GB" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sistema_operacional"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sistema operacional</FormLabel>
                <FormControl>
                  <Input placeholder="Windows 11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="senha_informada"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha informada</FormLabel>
                <FormControl>
                  <Input placeholder="Senha de acesso ao equipamento" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="estado_fisico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado físico geral</FormLabel>
                  <FormControl>
                    <Input placeholder="Riscos, amassados, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <FormSection title="Diagnóstico">
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="defeito_informado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Defeito informado pelo cliente</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="diagnostico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico técnico</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Preenchido após a análise" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <FormSection title="Datas">
          <FormField
            control={form.control}
            name="data_entrada"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de entrada</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="previsao_entrega"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previsão de entrega</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="garantia_ate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Garantia até</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection
          title="Checklist de entrada"
          description="Marque os itens que acompanham o equipamento."
        >
          <div className="sm:col-span-2">
            <ChecklistFields control={form.control} />
          </div>
        </FormSection>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <LoadingState /> : null}
            {equipamentoId ? "Salvar alterações" : "Cadastrar equipamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
