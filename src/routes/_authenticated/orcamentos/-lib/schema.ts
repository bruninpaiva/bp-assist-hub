import { z } from "zod";
import { Constants, type Database } from "@/integrations/supabase/types";
import { tipoEquipamentoLabels } from "@/lib/labels";
import type { OrcamentoComRelacoes, OSComRelacoes } from "@/types/domain";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const equipamentoLabel = (e: {
  tipo: Database["public"]["Enums"]["tipo_equipamento"];
  marca: string | null;
  modelo: string | null;
}) => [e.marca, e.modelo].filter(Boolean).join(" ") || tipoEquipamentoLabels[e.tipo];

const orcamentoItemSchema = z.object({
  tipo: z.enum(Constants.public.Enums.tipo_item_orcamento),
  descricao: z.string().trim().min(1, "Descreva o item").max(500),
  quantidade: z.number().min(0.01, "Quantidade deve ser maior que zero"),
  valor_unitario: z.number().min(0),
  desconto: z.number().min(0),
});

export type OrcamentoItemFormValues = z.infer<typeof orcamentoItemSchema>;

export const orcamentoSchema = z.object({
  os_id: z.string().min(1, "Selecione uma ordem de serviço"),
  os_numero: z.string().optional(),
  cliente_nome: z.string().optional(),
  equipamento_label: z.string().optional(),
  status: z.enum(Constants.public.Enums.status_orcamento),
  validade_dias: z.number().int().min(0),
  observacoes: optionalText(2000),
  desconto: z.number().min(0),
  itens: z.array(orcamentoItemSchema).min(1, "Adicione pelo menos um item ao orçamento"),
});

export type OrcamentoFormValues = z.infer<typeof orcamentoSchema>;

export const defaultOrcamentoFormValues: OrcamentoFormValues = {
  os_id: "",
  os_numero: "",
  cliente_nome: "",
  equipamento_label: "",
  status: "rascunho",
  validade_dias: 15,
  observacoes: "",
  desconto: 0,
  itens: [],
};

export function ordemSelecionadaParaFormValues(
  os: OSComRelacoes,
): Pick<OrcamentoFormValues, "os_id" | "os_numero" | "cliente_nome" | "equipamento_label"> {
  return {
    os_id: os.id,
    os_numero: os.numero_os ?? "",
    cliente_nome: os.clientes?.nome ?? "",
    equipamento_label: os.equipamentos ? equipamentoLabel(os.equipamentos) : "",
  };
}

export function orcamentoToFormValues(orcamento: OrcamentoComRelacoes): OrcamentoFormValues {
  return {
    os_id: orcamento.os_id,
    os_numero: orcamento.ordens_servico?.numero_os ?? "",
    cliente_nome: orcamento.clientes?.nome ?? "",
    equipamento_label: orcamento.equipamentos ? equipamentoLabel(orcamento.equipamentos) : "",
    status: orcamento.status,
    validade_dias: orcamento.validade_dias,
    observacoes: orcamento.observacoes ?? "",
    desconto: Number(orcamento.desconto),
    itens: (orcamento.orcamento_itens ?? []).map((item) => ({
      tipo: item.tipo,
      descricao: item.descricao,
      quantidade: Number(item.quantidade),
      valor_unitario: Number(item.valor_unitario),
      desconto: Number(item.desconto),
    })),
  };
}

export function toOrcamentoPayload(
  values: OrcamentoFormValues,
): Database["public"]["Tables"]["orcamentos"]["Insert"] {
  return {
    os_id: values.os_id,
    status: values.status,
    validade_dias: values.validade_dias,
    observacoes: values.observacoes?.trim() ? values.observacoes.trim() : null,
    desconto: values.desconto,
  };
}
