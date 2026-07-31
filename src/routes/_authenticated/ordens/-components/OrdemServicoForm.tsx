import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { FormSection } from "@/components/forms/FormSection";
import { brl } from "@/lib/format";
import { ordensService, configService, queryKeys } from "@/services/queries";
import { prioridadeLabels, statusOrdemServicoLabels } from "@/lib/labels";
import {
  ordemServicoSchema,
  toOrdemServicoPayload,
  type OrdemServicoFormValues,
} from "../-lib/schema";
import { ClienteEquipamentoFields } from "./ClienteEquipamentoFields";
import type { OrdemServico } from "@/types/domain";

export function OrdemServicoForm({
  ordemId,
  defaultValues,
  onCancel,
  onSaved,
}: {
  ordemId?: string;
  defaultValues: OrdemServicoFormValues;
  onCancel: () => void;
  onSaved: (ordem: OrdemServico) => void;
}) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OrdemServicoFormValues>({
    resolver: zodResolver(ordemServicoSchema),
    defaultValues,
  });

  const valorMaoObra = useWatch({ control: form.control, name: "valor_mao_obra" });
  const desconto = useWatch({ control: form.control, name: "desconto" });
  const valorTotal = Math.max(0, (valorMaoObra || 0) - (desconto || 0));

  const { data: usuarios } = useQuery({
    queryKey: queryKeys.usuarios,
    queryFn: configService.usuarios,
  });

  const onSubmit = async (values: OrdemServicoFormValues) => {
    setSubmitting(true);
    try {
      const payload = toOrdemServicoPayload(values);
      const ordem = ordemId
        ? await ordensService.update(ordemId, payload)
        : await ordensService.create(payload);

      await queryClient.invalidateQueries({ queryKey: ["ordens"] });
      toast.success(ordemId ? "Ordem de serviço atualizada" : "Ordem de serviço aberta");
      onSaved(ordem);
    } catch (error) {
      toast.error("Não foi possível salvar a ordem de serviço", {
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
          <ClienteEquipamentoFields control={form.control} setValue={form.setValue} />
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
                    {Object.entries(statusOrdemServicoLabels).map(([value, { label }]) => (
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
            name="prioridade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(prioridadeLabels).map(([value, { label }]) => (
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
            name="tecnico_responsavel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Técnico responsável</FormLabel>
                <Select
                  value={field.value || "none"}
                  onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Não atribuído" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Não atribuído</SelectItem>
                    {(usuarios ?? []).map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Diagnóstico e solução">
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="problema_relatado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problema relatado pelo cliente</FormLabel>
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
              name="solucao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviços executados / solução</FormLabel>
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

        <FormSection title="Valores">
          <FormField
            control={form.control}
            name="valor_mao_obra"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mão de obra (R$)</FormLabel>
                <FormControl>
                  <NumberInput step="0.01" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            <p className="flex h-9 items-center text-sm font-semibold">{brl(valorTotal)}</p>
          </div>
          <FormField
            control={form.control}
            name="garantia_dias"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Garantia (dias)</FormLabel>
                <FormControl>
                  <NumberInput min="0" step="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            name="data_conclusao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de conclusão</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data_entrega"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de entrega</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <LoadingState /> : null}
            {ordemId ? "Salvar alterações" : "Abrir ordem de serviço"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
