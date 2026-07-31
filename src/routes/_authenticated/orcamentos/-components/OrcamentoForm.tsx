import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { NumberInput } from "@/components/common/NumberInput";
import { LoadingState } from "@/components/common/LoadingState";
import { OrdemServicoCombobox } from "@/components/common/OrdemServicoCombobox";
import { FormSection } from "@/components/forms/FormSection";
import { brl } from "@/lib/format";
import { orcamentosService } from "@/services/queries";
import { statusOrcamentoLabels } from "@/lib/labels";
import {
  orcamentoSchema,
  ordemSelecionadaParaFormValues,
  toOrcamentoPayload,
  type OrcamentoFormValues,
} from "../-lib/schema";
import { ItensFields } from "./ItensFields";
import type { Orcamento } from "@/types/domain";

export function OrcamentoForm({
  orcamentoId,
  defaultValues,
  onCancel,
  onSaved,
}: {
  orcamentoId?: string;
  defaultValues: OrcamentoFormValues;
  onCancel: () => void;
  onSaved: (orcamento: Orcamento) => void;
}) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OrcamentoFormValues>({
    resolver: zodResolver(orcamentoSchema),
    defaultValues,
  });

  const osId = useWatch({ control: form.control, name: "os_id" });
  const osNumero = useWatch({ control: form.control, name: "os_numero" });
  const clienteNome = useWatch({ control: form.control, name: "cliente_nome" });
  const equipamentoLabel = useWatch({ control: form.control, name: "equipamento_label" });
  const itens = useWatch({ control: form.control, name: "itens" });
  const descontoOrcamento = useWatch({ control: form.control, name: "desconto" });

  const subtotal = (itens ?? []).reduce(
    (soma, item) => soma + Math.max(item.quantidade * item.valor_unitario - item.desconto, 0),
    0,
  );
  const total = Math.max(subtotal - (descontoOrcamento || 0), 0);

  const onSubmit = async (values: OrcamentoFormValues) => {
    setSubmitting(true);
    try {
      const payload = toOrcamentoPayload(values);
      const orcamento = orcamentoId
        ? await orcamentosService.update(orcamentoId, payload)
        : await orcamentosService.create(payload);

      await orcamentosService.salvarItens(orcamento.id, values.itens);

      await queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast.success(orcamentoId ? "Orçamento atualizado" : "Orçamento criado");
      onSaved(orcamento);
    } catch (error) {
      toast.error("Não foi possível salvar o orçamento", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Ordem de serviço">
          <FormField
            control={form.control}
            name="os_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem de serviço</FormLabel>
                <FormControl>
                  <OrdemServicoCombobox
                    value={field.value}
                    label={osNumero}
                    onChange={(os) => {
                      const derivados = ordemSelecionadaParaFormValues(os);
                      form.setValue("os_id", derivados.os_id, { shouldValidate: true });
                      form.setValue("os_numero", derivados.os_numero);
                      form.setValue("cliente_nome", derivados.cliente_nome);
                      form.setValue("equipamento_label", derivados.equipamento_label);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cliente</Label>
            <p className="flex h-9 items-center text-sm">
              {osId ? clienteNome || "—" : "Selecione uma ordem de serviço"}
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Equipamento</Label>
            <p className="flex h-9 items-center text-sm">
              {osId ? equipamentoLabel || "—" : "Selecione uma ordem de serviço"}
            </p>
          </div>
        </FormSection>

        <FormSection title="Situação">
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
                    {Object.entries(statusOrcamentoLabels).map(([value, { label }]) => (
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
            name="validade_dias"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Validade (dias)</FormLabel>
                <FormControl>
                  <NumberInput min="0" step="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Itens">
          <div className="sm:col-span-2">
            <ItensFields control={form.control} />
          </div>
        </FormSection>

        <FormSection title="Valores">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Subtotal</Label>
            <p className="flex h-9 items-center text-sm font-semibold">{brl(subtotal)}</p>
          </div>
          <FormField
            control={form.control}
            name="desconto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desconto (R$)</FormLabel>
                <FormControl>
                  <NumberInput step="0.01" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Label className="text-sm font-medium">Total</Label>
            <p className="flex h-9 items-center text-sm font-semibold">{brl(total)}</p>
          </div>
        </FormSection>

        <FormSection title="Observações">
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <LoadingState /> : null}
            {orcamentoId ? "Salvar alterações" : "Criar orçamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
