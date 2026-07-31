import { z } from "zod";
import { Constants, type Database } from "@/integrations/supabase/types";
import type { OSComRelacoes } from "@/types/domain";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const ordemServicoSchema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente"),
  cliente_nome: z.string().optional(),
  equipamento_id: z.string().min(1, "Selecione um equipamento"),
  status: z.enum(Constants.public.Enums.status_ordem_servico),
  prioridade: z.enum(Constants.public.Enums.prioridade),
  problema_relatado: z
    .string()
    .trim()
    .min(1, "Descreva o problema relatado pelo cliente")
    .max(2000),
  diagnostico: optionalText(2000),
  solucao: optionalText(2000),
  observacoes: optionalText(2000),
  valor_mao_obra: z.number().min(0),
  desconto: z.number().min(0),
  garantia_dias: z.number().int().min(0),
  tecnico_responsavel: z.string().optional().or(z.literal("")),
  data_entrada: z.string().min(1, "Informe a data de entrada"),
  previsao_entrega: optionalText(10),
  data_conclusao: optionalText(10),
  data_entrega: optionalText(10),
});

export type OrdemServicoFormValues = z.infer<typeof ordemServicoSchema>;

const hoje = () => new Date().toISOString().slice(0, 10);

export const defaultOrdemServicoFormValues: OrdemServicoFormValues = {
  cliente_id: "",
  cliente_nome: "",
  equipamento_id: "",
  status: "recebido",
  prioridade: "media",
  problema_relatado: "",
  diagnostico: "",
  solucao: "",
  observacoes: "",
  valor_mao_obra: 0,
  desconto: 0,
  garantia_dias: 90,
  tecnico_responsavel: "",
  data_entrada: hoje(),
  previsao_entrega: "",
  data_conclusao: "",
  data_entrega: "",
};

export function ordemServicoToFormValues(os: OSComRelacoes): OrdemServicoFormValues {
  return {
    cliente_id: os.cliente_id,
    cliente_nome: os.clientes?.nome ?? "",
    equipamento_id: os.equipamento_id,
    status: os.status,
    prioridade: os.prioridade,
    problema_relatado: os.problema_relatado,
    diagnostico: os.diagnostico ?? "",
    solucao: os.solucao ?? "",
    observacoes: os.observacoes ?? "",
    valor_mao_obra: Number(os.valor_mao_obra),
    desconto: Number(os.desconto),
    garantia_dias: os.garantia_dias,
    tecnico_responsavel: os.tecnico_responsavel ?? "",
    data_entrada: os.data_entrada.slice(0, 10),
    previsao_entrega: os.previsao_entrega?.slice(0, 10) ?? "",
    data_conclusao: os.data_conclusao?.slice(0, 10) ?? "",
    data_entrega: os.data_entrega?.slice(0, 10) ?? "",
  };
}

export function toOrdemServicoPayload(
  values: OrdemServicoFormValues,
): Database["public"]["Tables"]["ordens_servico"]["Insert"] {
  const emptyToNull = (v?: string) => (v?.trim() ? v.trim() : null);
  const dateToISO = (v?: string) => (v?.trim() ? new Date(v).toISOString() : null);

  return {
    cliente_id: values.cliente_id,
    equipamento_id: values.equipamento_id,
    status: values.status,
    prioridade: values.prioridade,
    problema_relatado: values.problema_relatado.trim(),
    diagnostico: emptyToNull(values.diagnostico),
    solucao: emptyToNull(values.solucao),
    observacoes: emptyToNull(values.observacoes),
    valor_mao_obra: values.valor_mao_obra,
    desconto: values.desconto,
    valor_total: Math.max(0, values.valor_mao_obra - values.desconto),
    garantia_dias: values.garantia_dias,
    tecnico_responsavel: emptyToNull(values.tecnico_responsavel),
    data_entrada: new Date(values.data_entrada).toISOString(),
    previsao_entrega: dateToISO(values.previsao_entrega),
    data_conclusao: dateToISO(values.data_conclusao),
    data_entrega: dateToISO(values.data_entrega),
  };
}
