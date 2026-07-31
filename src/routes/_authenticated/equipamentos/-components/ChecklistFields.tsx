import { useController, useFieldArray, type Control } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EquipamentoFormValues } from "../-lib/schema";

export function ChecklistFields({ control }: { control: Control<EquipamentoFormValues> }) {
  const { fields } = useFieldArray({ control, name: "checklist" });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field, index) => (
        <ChecklistRow key={field.id} control={control} index={index} nome={field.nome} />
      ))}
    </div>
  );
}

function ChecklistRow({
  control,
  index,
  nome,
}: {
  control: Control<EquipamentoFormValues>;
  index: number;
  nome: string;
}) {
  const { field: presenteField } = useController({ control, name: `checklist.${index}.presente` });
  const { field: observacaoField } = useController({
    control,
    name: `checklist.${index}.observacao`,
  });
  const id = `checklist-${index}`;

  return (
    <div className="surface-secondary flex items-start gap-3">
      <Checkbox
        id={id}
        checked={presenteField.value}
        onCheckedChange={(checked) => presenteField.onChange(checked === true)}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Label htmlFor={id} className="cursor-pointer font-medium">
          {nome}
        </Label>
        <Input
          placeholder="Observação (opcional)"
          className="h-8 text-xs"
          value={observacaoField.value ?? ""}
          onChange={observacaoField.onChange}
        />
      </div>
    </div>
  );
}
