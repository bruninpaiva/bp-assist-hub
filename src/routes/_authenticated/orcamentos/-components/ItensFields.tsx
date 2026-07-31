import { useFieldArray, useWatch, type Control } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { NumberInput } from "@/components/common/NumberInput";
import { Label } from "@/components/ui/label";
import { brl } from "@/lib/format";
import { tipoItemOrcamentoLabels } from "@/lib/labels";
import type { OrcamentoFormValues } from "../-lib/schema";

export function ItensFields({ control }: { control: Control<OrcamentoFormValues> }) {
  const { fields, append, remove, move } = useFieldArray({ control, name: "itens" });
  const itens = useWatch({ control, name: "itens" });

  const subtotalItem = (index: number) => {
    const item = itens?.[index];
    if (!item) return 0;
    return Math.max(item.quantidade * item.valor_unitario - item.desconto, 0);
  };

  const subtotalGeral = fields.reduce((soma, _, index) => soma + subtotalItem(index), 0);

  return (
    <div className="space-y-3">
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item adicionado ainda.</p>
      ) : (
        fields.map((field, index) => (
          <div
            key={field.id}
            className="surface-secondary grid gap-3 sm:grid-cols-12 sm:items-start"
          >
            <div className="sm:col-span-2">
              <FormField
                control={control}
                name={`itens.${index}.tipo`}
                render={({ field: tipoField }) => (
                  <FormItem>
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <Select value={tipoField.value} onValueChange={tipoField.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(tipoItemOrcamentoLabels).map(([value, label]) => (
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
            </div>

            <div className="sm:col-span-4">
              <FormField
                control={control}
                name={`itens.${index}.descricao`}
                render={({ field: descricaoField }) => (
                  <FormItem>
                    <Label className="text-xs text-muted-foreground">Descrição</Label>
                    <FormControl>
                      <Input placeholder="Ex.: Troca de tela" {...descricaoField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="sm:col-span-1">
              <FormField
                control={control}
                name={`itens.${index}.quantidade`}
                render={({ field: quantidadeField }) => (
                  <FormItem>
                    <Label className="text-xs text-muted-foreground">Qtde.</Label>
                    <FormControl>
                      <NumberInput step="0.01" min="0" {...quantidadeField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="sm:col-span-2">
              <FormField
                control={control}
                name={`itens.${index}.valor_unitario`}
                render={({ field: valorField }) => (
                  <FormItem>
                    <Label className="text-xs text-muted-foreground">Valor unitário</Label>
                    <FormControl>
                      <NumberInput step="0.01" min="0" {...valorField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="sm:col-span-1">
              <FormField
                control={control}
                name={`itens.${index}.desconto`}
                render={({ field: descontoField }) => (
                  <FormItem>
                    <Label className="text-xs text-muted-foreground">Desconto</Label>
                    <FormControl>
                      <NumberInput step="0.01" min="0" {...descontoField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2 sm:col-span-1">
              <Label className="text-xs text-muted-foreground">Subtotal</Label>
              <p className="flex h-9 items-center text-sm font-semibold">
                {brl(subtotalItem(index))}
              </p>
            </div>

            <div className="flex items-end justify-end gap-1 sm:col-span-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
                title="Mover para cima"
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === fields.length - 1}
                onClick={() => move(index, index + 1)}
                title="Mover para baixo"
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => remove(index)}
                title="Remover item"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))
      )}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              tipo: "servico",
              descricao: "",
              quantidade: 1,
              valor_unitario: 0,
              desconto: 0,
            })
          }
        >
          <Plus className="size-4" /> Adicionar item
        </Button>
        <p className="text-sm text-muted-foreground">
          Subtotal dos itens:{" "}
          <span className="font-semibold text-foreground">{brl(subtotalGeral)}</span>
        </p>
      </div>
    </div>
  );
}
