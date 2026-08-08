import type {
  AcaoAprovacaoOrcamento,
  AppRole,
  CategoriaFoto,
  Prioridade,
  SituacaoPecaOS,
  StatusEquipamento,
  StatusLancamento,
  StatusOrdemServico,
  StatusOrcamento,
  StatusOS,
  TipoAgenda,
  TipoEquipamento,
  TipoItemOrcamento,
  TipoMovimentacao,
  TipoPessoa,
} from "@/types/domain";

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "primary";

/** @deprecated Mantido só pelas telas de exemplo (Dashboard, Configurações). Ordens de Serviço usa statusOrdemServicoLabels. */
export const statusOSLabels: Record<StatusOS, { label: string; tone: Tone }> = {
  aberta: { label: "Aberta", tone: "info" },
  em_analise: { label: "Em análise", tone: "primary" },
  aguardando_aprovacao: { label: "Aguardando aprovação", tone: "warning" },
  aguardando_peca: { label: "Aguardando peça", tone: "warning" },
  em_execucao: { label: "Em execução", tone: "primary" },
  concluida: { label: "Concluída", tone: "success" },
  entregue: { label: "Entregue", tone: "success" },
  cancelada: { label: "Cancelada", tone: "danger" },
};

export const statusOrdemServicoLabels: Record<StatusOrdemServico, { label: string; tone: Tone }> = {
  recebido: { label: "Recebido", tone: "info" },
  em_analise: { label: "Em análise", tone: "primary" },
  aguardando_orcamento: { label: "Aguardando orçamento", tone: "warning" },
  aguardando_aprovacao: { label: "Aguardando aprovação", tone: "warning" },
  aguardando_peca: { label: "Aguardando peça", tone: "warning" },
  em_manutencao: { label: "Em manutenção", tone: "primary" },
  teste: { label: "Teste", tone: "primary" },
  pronto: { label: "Pronto", tone: "success" },
  entregue: { label: "Entregue", tone: "success" },
  cancelado: { label: "Cancelado", tone: "danger" },
};

export const prioridadeLabels: Record<Prioridade, { label: string; tone: Tone }> = {
  baixa: { label: "Baixa", tone: "neutral" },
  media: { label: "Normal", tone: "info" },
  alta: { label: "Alta", tone: "warning" },
  urgente: { label: "Urgente", tone: "danger" },
};

export const statusOrcamentoLabels: Record<StatusOrcamento, { label: string; tone: Tone }> = {
  rascunho: { label: "Rascunho", tone: "neutral" },
  enviado: { label: "Enviado", tone: "info" },
  aprovado: { label: "Aprovado", tone: "success" },
  // O valor do enum continua "recusado" (banco não foi quebrado); só o rótulo mudou.
  recusado: { label: "Reprovado", tone: "danger" },
  expirado: { label: "Expirado", tone: "warning" },
  cancelado: { label: "Cancelado", tone: "neutral" },
};

export const statusLancamentoLabels: Record<StatusLancamento, { label: string; tone: Tone }> = {
  pendente: { label: "Pendente", tone: "warning" },
  pago: { label: "Pago", tone: "success" },
  atrasado: { label: "Atrasado", tone: "danger" },
  cancelado: { label: "Cancelado", tone: "neutral" },
};

export const statusEquipamentoLabels: Record<StatusEquipamento, { label: string; tone: Tone }> = {
  recebido: { label: "Recebido", tone: "info" },
  em_analise: { label: "Em análise", tone: "primary" },
  aguardando_orcamento: { label: "Aguardando orçamento", tone: "warning" },
  aguardando_aprovacao: { label: "Aguardando aprovação", tone: "warning" },
  aguardando_peca: { label: "Aguardando peça", tone: "warning" },
  em_manutencao: { label: "Em manutenção", tone: "primary" },
  pronto: { label: "Pronto", tone: "success" },
  entregue: { label: "Entregue", tone: "success" },
  cancelado: { label: "Cancelado", tone: "danger" },
};

export const tipoItemOrcamentoLabels: Record<TipoItemOrcamento, string> = {
  produto: "Produto",
  servico: "Serviço",
};

export const acaoAprovacaoLabels: Record<AcaoAprovacaoOrcamento, { label: string; tone: Tone }> = {
  aprovado: { label: "Aprovado pelo cliente", tone: "success" },
  recusado: { label: "Reprovado pelo cliente", tone: "danger" },
  alteracao_solicitada: { label: "Alteração solicitada", tone: "warning" },
};

export const categoriaFotoLabels: Record<CategoriaFoto, string> = {
  entrada: "Entrada",
  durante_manutencao: "Durante manutenção",
  final: "Final",
  entrega: "Entrega",
};

export const tipoEquipamentoLabels: Record<TipoEquipamento, string> = {
  notebook: "Notebook",
  desktop: "Desktop",
  servidor: "Servidor",
  monitor: "Monitor",
  impressora: "Impressora",
  switch: "Switch",
  roteador: "Roteador",
  nobreak: "Nobreak",
  outros: "Outros",
};

export const tipoPessoaLabels: Record<TipoPessoa, string> = {
  fisica: "Pessoa Física",
  juridica: "Pessoa Jurídica",
};

export const tipoAgendaLabels: Record<TipoAgenda, string> = {
  visita: "Visita técnica",
  retirada: "Retirada",
  entrega: "Entrega",
  manutencao: "Manutenção",
  compromisso: "Compromisso",
};

export const tipoMovimentacaoLabels: Record<TipoMovimentacao, { label: string; tone: Tone }> = {
  entrada: { label: "Entrada", tone: "success" },
  saida: { label: "Saída", tone: "danger" },
  reserva: { label: "Reserva para OS", tone: "warning" },
  liberacao_reserva: { label: "Liberação de reserva", tone: "info" },
  uso_os: { label: "Uso em OS", tone: "primary" },
  ajuste_positivo: { label: "Ajuste positivo", tone: "success" },
  ajuste_negativo: { label: "Ajuste negativo", tone: "danger" },
  devolucao: { label: "Devolução", tone: "info" },
  ajuste: { label: "Ajuste", tone: "neutral" },
};

export const situacaoPecaLabels: Record<SituacaoPecaOS, { label: string; tone: Tone }> = {
  reservada: { label: "Reservado", tone: "warning" },
  utilizada: { label: "Utilizado", tone: "success" },
  removida: { label: "Removido", tone: "neutral" },
  devolvida: { label: "Devolvido", tone: "info" },
};

export const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  tecnico: "Técnico",
  financeiro: "Financeiro",
  atendente: "Atendente",
};

export const enumOptions = <T extends string>(record: Record<T, string>) =>
  (Object.keys(record) as T[]).map((value) => ({ value, label: record[value] }));

export const statusOptions = <T extends string>(record: Record<T, { label: string }>) =>
  (Object.keys(record) as T[]).map((value) => ({ value, label: record[value].label }));
