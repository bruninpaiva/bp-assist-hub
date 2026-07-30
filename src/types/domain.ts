import type { Database, Tables } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type TipoPessoa = Database["public"]["Enums"]["tipo_pessoa"];
export type TipoEquipamento = Database["public"]["Enums"]["tipo_equipamento"];
export type StatusOS = Database["public"]["Enums"]["status_os"];
export type Prioridade = Database["public"]["Enums"]["prioridade"];
export type StatusOrcamento = Database["public"]["Enums"]["status_orcamento"];
export type TipoLancamento = Database["public"]["Enums"]["tipo_lancamento"];
export type StatusLancamento = Database["public"]["Enums"]["status_lancamento"];
export type TipoMovimentacao = Database["public"]["Enums"]["tipo_movimentacao"];
export type TipoAgenda = Database["public"]["Enums"]["tipo_agenda"];

export type Profile = Tables<"profiles">;
export type Cliente = Tables<"clientes">;
export type Equipamento = Tables<"equipamentos">;
export type OrdemServico = Tables<"ordens_servico">;
export type OSEvento = Tables<"os_eventos">;
export type Orcamento = Tables<"orcamentos">;
export type OrcamentoItem = Tables<"orcamento_itens">;
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

export type OSComRelacoes = OrdemServico & {
  clientes?: Pick<Cliente, "id" | "nome"> | null;
  equipamentos?: Pick<Equipamento, "id" | "tipo" | "marca" | "modelo"> | null;
};

export type OrcamentoComRelacoes = Orcamento & {
  clientes?: Pick<Cliente, "id" | "nome"> | null;
  orcamento_itens?: OrcamentoItem[];
};