import { z } from "zod";
import { Constants, type Database } from "@/integrations/supabase/types";
import type { ChecklistItem, EquipamentoComRelacoes } from "@/types/domain";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

const checklistRespostaSchema = z.object({
  item_id: z.string(),
  nome: z.string(),
  presente: z.boolean(),
  observacao: optionalText(200),
});

export const equipamentoSchema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente"),
  cliente_nome: z.string().optional(),
  tipo: z.enum(Constants.public.Enums.tipo_equipamento),
  marca: optionalText(120),
  modelo: optionalText(120),
  numero_serie: optionalText(120),
  patrimonio: optionalText(60),
  processador: optionalText(120),
  memoria_ram: optionalText(60),
  armazenamento: optionalText(60),
  sistema_operacional: optionalText(60),
  senha_informada: optionalText(120),
  estado_fisico: optionalText(500),
  defeito_informado: z
    .string()
    .trim()
    .min(1, "Descreva o defeito informado pelo cliente")
    .max(2000),
  diagnostico: optionalText(2000),
  observacoes: optionalText(2000),
  status: z.enum(Constants.public.Enums.status_equipamento),
  data_entrada: z.string().min(1, "Informe a data de entrada"),
  previsao_entrega: optionalText(10),
  garantia_ate: optionalText(10),
  checklist: z.array(checklistRespostaSchema),
});

export type EquipamentoFormValues = z.infer<typeof equipamentoSchema>;

const hoje = () => new Date().toISOString().slice(0, 10);

export function defaultEquipamentoFormValues(
  checklistItens: ChecklistItem[],
): EquipamentoFormValues {
  return {
    cliente_id: "",
    cliente_nome: "",
    tipo: "notebook",
    marca: "",
    modelo: "",
    numero_serie: "",
    patrimonio: "",
    processador: "",
    memoria_ram: "",
    armazenamento: "",
    sistema_operacional: "",
    senha_informada: "",
    estado_fisico: "",
    defeito_informado: "",
    diagnostico: "",
    observacoes: "",
    status: "recebido",
    data_entrada: hoje(),
    previsao_entrega: "",
    garantia_ate: "",
    checklist: checklistItens.map((item) => ({
      item_id: item.id,
      nome: item.nome,
      presente: false,
      observacao: "",
    })),
  };
}

export function equipamentoToFormValues(
  equipamento: EquipamentoComRelacoes,
  checklistItens: ChecklistItem[],
): EquipamentoFormValues {
  const respostasPorItem = new Map(
    (equipamento.equipamento_checklist ?? [])
      .filter((r) => r.item_id)
      .map((r) => [r.item_id as string, r]),
  );

  return {
    cliente_id: equipamento.cliente_id ?? "",
    cliente_nome: equipamento.clientes?.nome ?? "",
    tipo: equipamento.tipo,
    marca: equipamento.marca ?? "",
    modelo: equipamento.modelo ?? "",
    numero_serie: equipamento.numero_serie ?? "",
    patrimonio: equipamento.patrimonio ?? "",
    processador: equipamento.processador ?? "",
    memoria_ram: equipamento.memoria_ram ?? "",
    armazenamento: equipamento.armazenamento ?? "",
    sistema_operacional: equipamento.sistema_operacional ?? "",
    senha_informada: equipamento.senha_informada ?? "",
    estado_fisico: equipamento.estado_fisico ?? "",
    defeito_informado: equipamento.defeito_informado ?? "",
    diagnostico: equipamento.diagnostico ?? "",
    observacoes: equipamento.observacoes ?? "",
    status: equipamento.status,
    data_entrada: equipamento.data_entrada.slice(0, 10),
    previsao_entrega: equipamento.previsao_entrega?.slice(0, 10) ?? "",
    garantia_ate: equipamento.garantia_ate?.slice(0, 10) ?? "",
    checklist: checklistItens.map((item) => {
      const resposta = respostasPorItem.get(item.id);
      return {
        item_id: item.id,
        nome: item.nome,
        presente: resposta?.presente ?? false,
        observacao: resposta?.observacao ?? "",
      };
    }),
  };
}

export function toEquipamentoPayload(
  values: EquipamentoFormValues,
): Database["public"]["Tables"]["equipamentos"]["Insert"] {
  const emptyToNull = (v?: string) => (v?.trim() ? v.trim() : null);

  return {
    cliente_id: values.cliente_id,
    tipo: values.tipo,
    marca: emptyToNull(values.marca),
    modelo: emptyToNull(values.modelo),
    numero_serie: emptyToNull(values.numero_serie),
    patrimonio: emptyToNull(values.patrimonio),
    processador: emptyToNull(values.processador),
    memoria_ram: emptyToNull(values.memoria_ram),
    armazenamento: emptyToNull(values.armazenamento),
    sistema_operacional: emptyToNull(values.sistema_operacional),
    senha_informada: emptyToNull(values.senha_informada),
    estado_fisico: emptyToNull(values.estado_fisico),
    defeito_informado: values.defeito_informado.trim(),
    diagnostico: emptyToNull(values.diagnostico),
    observacoes: emptyToNull(values.observacoes),
    status: values.status,
    data_entrada: new Date(values.data_entrada).toISOString(),
    previsao_entrega: values.previsao_entrega
      ? new Date(values.previsao_entrega).toISOString()
      : null,
    garantia_ate: emptyToNull(values.garantia_ate),
  };
}
