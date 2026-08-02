export const faturamentoMensal = [
  { mes: "Fev", receita: 12400, despesa: 7100 },
  { mes: "Mar", receita: 15200, despesa: 8300 },
  { mes: "Abr", receita: 13800, despesa: 7600 },
  { mes: "Mai", receita: 18900, despesa: 9400 },
  { mes: "Jun", receita: 21400, despesa: 10200 },
  { mes: "Jul", receita: 24800, despesa: 11150 },
];

export const osPorTipo = [
  { tipo: "Notebook", total: 34 },
  { tipo: "Desktop", total: 27 },
  { tipo: "Impressora", total: 14 },
  { tipo: "Servidor", total: 8 },
  { tipo: "Rede", total: 11 },
];

export const ultimasOS = [
  {
    numero: 1042,
    cliente: "OdontoMega Import. Com. Prod. Odontológicos",
    equipamento: "Desktop Biostar H410M",
    status: "em_execucao" as const,
    prioridade: "alta" as const,
    valor: 780,
  },
  {
    numero: 1041,
    cliente: "Padaria Jardinópolis",
    equipamento: "Notebook Acer Aspire 5",
    status: "aguardando_peca" as const,
    prioridade: "media" as const,
    valor: 420,
  },
  {
    numero: 1040,
    cliente: "Clínica São Lucas",
    equipamento: "Servidor Dell T140",
    status: "aguardando_aprovacao" as const,
    prioridade: "urgente" as const,
    valor: 2380,
  },
  {
    numero: 1039,
    cliente: "Marcos Pereira",
    equipamento: "Impressora Epson L3250",
    status: "concluida" as const,
    prioridade: "baixa" as const,
    valor: 190,
  },
  {
    numero: 1038,
    cliente: "Auto Peças Ribeirão",
    equipamento: "Nobreak SMS 1500VA",
    status: "entregue" as const,
    prioridade: "media" as const,
    valor: 340,
  },
];

export const ultimosOrcamentos = [
  {
    numero: 67,
    cliente: "OdontoMega Import. Com. Prod. Odontológicos",
    total: 2538,
    status: "aprovado" as const,
  },
  { numero: 66, cliente: "Clínica São Lucas", total: 4180, status: "enviado" as const },
  { numero: 65, cliente: "Auto Peças Ribeirão", total: 890, status: "rascunho" as const },
  { numero: 64, cliente: "Padaria Jardinópolis", total: 1260, status: "recusado" as const },
];

export const fluxoResumo = {
  entradas: 24800,
  saidas: 11150,
  aReceber: 6420,
  aPagar: 3180,
};
