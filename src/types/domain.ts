import type { Database, Tables } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type TipoPessoa = Database["public"]["Enums"]["tipo_pessoa"];
export type TipoEquipamento = Database["public"]["Enums"]["tipo_equipamento"];
export type StatusEquipamento = Database["public"]["Enums"]["status_equipamento"];
export type CategoriaFoto = Database["public"]["Enums"]["categoria_foto"];
export type StatusOrdemServico = Database["public"]["Enums"]["status_ordem_servico"];
/** @deprecated Mantido apenas pelas telas de exemplo (Dashboard, Configurações). O módulo de Ordens de Serviço usa StatusOrdemServico. */
export type StatusOS = Database["public"]["Enums"]["status_os"];
export type Prioridade = Database["public"]["Enums"]["prioridade"];
export type StatusOrcamento = Database["public"]["Enums"]["status_orcamento"];
export type TipoLancamento = Database["public"]["Enums"]["tipo_lancamento"];
export type StatusLancamento = Database["public"]["Enums"]["status_lancamento"];
export type TipoMovimentacao = Database["public"]["Enums"]["tipo_movimentacao"];
export type TipoAgenda = Database["public"]["Enums"]["tipo_agenda"];
export type TipoItemOrcamento = Database["public"]["Enums"]["tipo_item_orcamento"];
export type AcaoAprovacaoOrcamento = Database["public"]["Enums"]["acao_aprovacao_orcamento"];

export type Profile = Tables<"profiles">;
export type Cliente = Tables<"clientes">;
export type Equipamento = Tables<"equipamentos">;
export type ChecklistItem = Tables<"checklist_itens">;
export type EquipamentoChecklist = Tables<"equipamento_checklist">;
export type EquipamentoFoto = Tables<"equipamento_fotos">;
export type EquipamentoEvento = Tables<"equipamento_eventos">;
export type OrdemServico = Tables<"ordens_servico">;
export type OSEvento = Tables<"os_eventos">;
export type Orcamento = Tables<"orcamentos">;
export type OrcamentoItem = Tables<"orcamento_itens">;
export type OrcamentoEvento = Tables<"orcamento_eventos">;
export type OrcamentoAprovacao = Tables<"orcamento_aprovacoes">;
export type Lancamento = Tables<"lancamentos">;
export type CategoriaFinanceira = Tables<"categorias_financeiras">;
export type Produto = Tables<"produtos">;
export type CategoriaProduto = Tables<"categorias_produto">;
export type Fornecedor = Tables<"fornecedores">;
export type MovimentacaoEstoque = Tables<"movimentacoes_estoque">;
export type AgendaEvento = Tables<"agenda_eventos">;
export type Empresa = Tables<"empresa">;

export type ClienteComRelacoes = Cliente & {
  equipamentos?: Equipamento[];
};

export type EquipamentoComRelacoes = Equipamento & {
  clientes?: Pick<Cliente, "id" | "nome" | "telefone" | "whatsapp"> | null;
  equipamento_checklist?: (EquipamentoChecklist & { checklist_itens?: ChecklistItem | null })[];
  equipamento_fotos?: EquipamentoFoto[];
  equipamento_eventos?: EquipamentoEvento[];
};

export type OSComRelacoes = OrdemServico & {
  clientes?: Cliente | null;
  equipamentos?: Equipamento | null;
  os_eventos?: OSEvento[];
};

export type OrcamentoComRelacoes = Orcamento & {
  clientes?: Cliente | null;
  equipamentos?: Equipamento | null;
  ordens_servico?: Pick<OrdemServico, "id" | "numero_os" | "problema_relatado"> | null;
  orcamento_itens?: OrcamentoItem[];
  orcamento_eventos?: OrcamentoEvento[];
  orcamento_aprovacoes?: OrcamentoAprovacao[];
};
