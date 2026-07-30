import type {
  AppRole,
  Prioridade,
  StatusLancamento,
  StatusOS,
  StatusOrcamento,
  TipoAgenda,
  TipoEquipamento,
  TipoMovimentacao,
  TipoPessoa,
} from "@/types/domain";

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "primary";

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

export const prioridadeLabels: Record<Prioridade, { label: string; tone: Tone }> = {
  baixa: { label: "Baixa", tone: "neutral" },
  media: { label: "Média", tone: "info" },
  alta: { label: "Alta", tone: "warning" },
  urgente: { label: "Urgente", tone: "danger" },
};

export const statusOrcamentoLabels: Record<StatusOrcamento, { label: string; tone: Tone }> = {
  rascunho: { label: "Rascunho", tone: "neutral" },
  enviado: { label: "Enviado", tone: "info" },
  aprovado: { label: "Aprovado", tone: "success" },
  recusado: { label: "Recusado", tone: "danger" },
  expirado: { label: "Expirado", tone: "warning" },
};

export const statusLancamentoLabels: Record<StatusLancamento, { label: string; tone: Tone }> = {
  pendente: { label: "Pendente", tone: "warning" },
  pago: { label: "Pago", tone: "success" },
  atrasado: { label: "Atrasado", tone: "danger" },
  cancelado: { label: "Cancelado", tone: "neutral" },
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

export const tipoMovimentacaoLabels: Record<TipoMovimentacao, string> = {
  entrada: "Entrada",
  saida: "Saída",
  ajuste: "Ajuste",
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