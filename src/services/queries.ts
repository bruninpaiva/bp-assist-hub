import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { onlyDigits } from "@/lib/masks";
import { gerarTokenSeguro } from "@/lib/token";
import { storageService } from "@/services/storage";
import type {
  AcaoAprovacaoOrcamento,
  CategoriaFoto,
  Cliente,
  Prioridade,
  StatusEquipamento,
  StatusOrdemServico,
  StatusOrcamento,
  TipoEquipamento,
  TipoPessoa,
} from "@/types/domain";

const EQUIPAMENTO_FOTOS_BUCKET = "equipamento-fotos";
const ORCAMENTO_PDFS_BUCKET = "orcamento-pdfs";

export const queryKeys = {
  clientes: (params?: ClientesListParams) => ["clientes", params ?? {}] as const,
  cliente: (id: string) => ["clientes", id] as const,
  equipamentos: (params?: EquipamentosListParams) => ["equipamentos", params ?? {}] as const,
  equipamento: (id: string) => ["equipamentos", id] as const,
  checklistItens: ["checklist_itens"] as const,
  ordens: (params?: OrdensListParams) => ["ordens", params ?? {}] as const,
  ordem: (id: string) => ["ordens", id] as const,
  orcamentos: (params?: OrcamentosListParams) => ["orcamentos", params ?? {}] as const,
  orcamento: (id: string) => ["orcamentos", id] as const,
  lancamentos: ["lancamentos"] as const,
  categoriasFinanceiras: ["categorias_financeiras"] as const,
  produtos: ["produtos"] as const,
  categoriasProduto: ["categorias_produto"] as const,
  fornecedores: ["fornecedores"] as const,
  movimentacoes: ["movimentacoes"] as const,
  agenda: ["agenda"] as const,
  empresa: ["empresa"] as const,
  usuarios: ["usuarios"] as const,
};

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? ([] as unknown)) as T;
}

export type ClientesOrdenarPor = "nome" | "created_at";
export type ClientesStatus = "todos" | "ativos" | "inativos";
export type ClientesTipo = "todos" | TipoPessoa;

export interface ClientesListParams {
  busca?: string;
  tipo?: ClientesTipo;
  status?: ClientesStatus;
  ordenarPor?: ClientesOrdenarPor;
  ordem?: "asc" | "desc";
  pagina?: number;
  porPagina?: number;
}

export interface ClientesListResult {
  data: Cliente[];
  total: number;
}

export interface ClienteDuplicadoParams {
  cpf?: string | null;
  cnpj?: string | null;
  excluirId?: string;
}

export const clientesService = {
  list: async (params: ClientesListParams = {}): Promise<ClientesListResult> => {
    const {
      busca,
      tipo = "todos",
      status = "todos",
      ordenarPor = "created_at",
      ordem = "desc",
      pagina = 1,
      porPagina = 10,
    } = params;

    let query = supabase.from("clientes").select("*", { count: "exact" }).is("deleted_at", null);

    if (busca?.trim()) {
      const termo = busca.trim();
      const digitos = onlyDigits(termo);
      const condicoes = [`nome.ilike.%${termo}%`, `email.ilike.%${termo}%`];
      if (digitos) {
        condicoes.push(
          `cpf.ilike.%${digitos}%`,
          `cnpj.ilike.%${digitos}%`,
          `telefone.ilike.%${digitos}%`,
        );
      }
      query = query.or(condicoes.join(","));
    }

    if (tipo !== "todos") query = query.eq("tipo_pessoa", tipo);
    if (status === "ativos") query = query.eq("ativo", true);
    if (status === "inativos") query = query.eq("ativo", false);

    query = query.order(ordenarPor, { ascending: ordem === "asc" });

    const from = (pagina - 1) * porPagina;
    query = query.range(from, from + porPagina - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: (data ?? []) as Cliente[], total: count ?? 0 };
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from("clientes")
      .select("*, equipamentos(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  /** Retorna true se já existir outro cliente (não excluído) com o mesmo CPF ou CNPJ. */
  checkDuplicado: async ({ cpf, cnpj, excluirId }: ClienteDuplicadoParams) => {
    const documento = onlyDigits(cpf) || onlyDigits(cnpj);
    if (!documento) return false;

    let query = supabase
      .from("clientes")
      .select("id")
      .is("deleted_at", null)
      .or(`cpf.eq.${documento},cnpj.eq.${documento}`);

    if (excluirId) query = query.neq("id", excluirId);

    const { data, error } = await query.limit(1);
    if (error) throw new Error(error.message);
    return (data ?? []).length > 0;
  },

  create: async (payload: Database["public"]["Tables"]["clientes"]["Insert"]) => {
    const { data, error } = await supabase.from("clientes").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (id: string, payload: Database["public"]["Tables"]["clientes"]["Update"]) => {
    const { data, error } = await supabase
      .from("clientes")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  softDelete: async (id: string) => {
    const { error } = await supabase
      .from("clientes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export type EquipamentosOrdenarPor = "created_at" | "marca" | "modelo";
export type EquipamentosStatus = "todos" | StatusEquipamento;
export type EquipamentosTipo = "todos" | TipoEquipamento;

export interface EquipamentosListParams {
  busca?: string;
  tipo?: EquipamentosTipo;
  status?: EquipamentosStatus;
  clienteId?: string;
  ordenarPor?: EquipamentosOrdenarPor;
  ordem?: "asc" | "desc";
  pagina?: number;
  porPagina?: number;
}

export interface EquipamentosListResult {
  data: Database["public"]["Tables"]["equipamentos"]["Row"][];
  total: number;
}

export interface ChecklistRespostaInput {
  item_id: string;
  presente: boolean;
  observacao?: string | null;
}

export const equipamentosService = {
  list: async (params: EquipamentosListParams = {}): Promise<EquipamentosListResult> => {
    const {
      busca,
      tipo = "todos",
      status = "todos",
      clienteId,
      ordenarPor = "created_at",
      ordem = "desc",
      pagina = 1,
      porPagina = 10,
    } = params;

    let query = supabase
      .from("equipamentos")
      .select("*, clientes(id, nome)", { count: "exact" })
      .is("deleted_at", null);

    if (clienteId) query = query.eq("cliente_id", clienteId);

    if (busca?.trim()) {
      const termo = busca.trim();
      // PostgREST não filtra colunas de tabelas relacionadas dentro de um
      // .or() — resolve os clientes correspondentes antes e combina os ids.
      const { data: clientesMatch } = await supabase
        .from("clientes")
        .select("id")
        .ilike("nome", `%${termo}%`)
        .limit(50);

      const condicoes = [
        `marca.ilike.%${termo}%`,
        `modelo.ilike.%${termo}%`,
        `numero_serie.ilike.%${termo}%`,
        `patrimonio.ilike.%${termo}%`,
      ];
      if (clientesMatch?.length) {
        condicoes.push(`cliente_id.in.(${clientesMatch.map((c) => c.id).join(",")})`);
      }
      query = query.or(condicoes.join(","));
    }

    if (tipo !== "todos") query = query.eq("tipo", tipo);
    if (status !== "todos") query = query.eq("status", status);

    query = query.order(ordenarPor, { ascending: ordem === "asc" });

    const from = (pagina - 1) * porPagina;
    query = query.range(from, from + porPagina - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: data ?? [], total: count ?? 0 };
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from("equipamentos")
      .select(
        "*, clientes(id, nome, telefone, whatsapp), equipamento_checklist(*, checklist_itens(*)), equipamento_fotos(*), equipamento_eventos(*)",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  create: async (payload: Database["public"]["Tables"]["equipamentos"]["Insert"]) => {
    const { data, error } = await supabase.from("equipamentos").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (id: string, payload: Database["public"]["Tables"]["equipamentos"]["Update"]) => {
    const { data, error } = await supabase
      .from("equipamentos")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  softDelete: async (id: string) => {
    const { error } = await supabase
      .from("equipamentos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  listChecklistItens: async () =>
    unwrap(
      await supabase
        .from("checklist_itens")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true }),
    ),

  salvarChecklist: async (equipamentoId: string, respostas: ChecklistRespostaInput[]) => {
    if (!respostas.length) return;
    const { error } = await supabase.from("equipamento_checklist").upsert(
      respostas.map((r) => ({ equipamento_id: equipamentoId, ...r })),
      { onConflict: "equipamento_id,item_id" },
    );
    if (error) throw new Error(error.message);
  },

  uploadFoto: async (equipamentoId: string, categoria: CategoriaFoto, file: File) => {
    const path = `${equipamentoId}/${categoria}/${Date.now()}-${file.name}`;
    await storageService.upload(EQUIPAMENTO_FOTOS_BUCKET, path, file);
    const { error } = await supabase
      .from("equipamento_fotos")
      .insert({ equipamento_id: equipamentoId, categoria, storage_path: path });
    if (error) throw new Error(error.message);
  },

  removerFoto: async (fotoId: string, storagePath: string) => {
    await storageService.remove(EQUIPAMENTO_FOTOS_BUCKET, storagePath);
    const { error } = await supabase.from("equipamento_fotos").delete().eq("id", fotoId);
    if (error) throw new Error(error.message);
  },

  fotoUrl: (storagePath: string) =>
    storageService.createSignedUrl(EQUIPAMENTO_FOTOS_BUCKET, storagePath),

  /** Assina os caminhos de várias fotos de uma vez — usado pela galeria. */
  fotoUrls: (storagePaths: string[]) =>
    storageService.createSignedUrls(EQUIPAMENTO_FOTOS_BUCKET, storagePaths),
};

export type OrdensOrdenarPor = "data_entrada" | "numero";
export type OrdensStatus = "todos" | StatusOrdemServico;
export type OrdensPrioridade = "todos" | Prioridade;

export interface OrdensListParams {
  busca?: string;
  status?: OrdensStatus;
  prioridade?: OrdensPrioridade;
  tecnicoId?: string;
  clienteId?: string;
  dataDe?: string;
  dataAte?: string;
  ordenarPor?: OrdensOrdenarPor;
  ordem?: "asc" | "desc";
  pagina?: number;
  porPagina?: number;
}

export interface OrdensListResult {
  data: Database["public"]["Tables"]["ordens_servico"]["Row"][];
  total: number;
}

export const ordensService = {
  list: async (params: OrdensListParams = {}): Promise<OrdensListResult> => {
    const {
      busca,
      status = "todos",
      prioridade = "todos",
      tecnicoId,
      clienteId,
      dataDe,
      dataAte,
      ordenarPor = "data_entrada",
      ordem = "desc",
      pagina = 1,
      porPagina = 10,
    } = params;

    let query = supabase
      .from("ordens_servico")
      .select("*, clientes(id, nome), equipamentos(id, tipo, marca, modelo, numero_serie)", {
        count: "exact",
      })
      .is("deleted_at", null);

    if (busca?.trim()) {
      const termo = busca.trim();
      // PostgREST não filtra colunas de tabelas relacionadas dentro de um
      // .or() — resolve clientes/equipamentos correspondentes antes.
      const [{ data: clientesMatch }, { data: equipamentosMatch }] = await Promise.all([
        supabase.from("clientes").select("id").ilike("nome", `%${termo}%`).limit(50),
        supabase
          .from("equipamentos")
          .select("id")
          .or(`marca.ilike.%${termo}%,modelo.ilike.%${termo}%,numero_serie.ilike.%${termo}%`)
          .limit(50),
      ]);

      const condicoes = [`numero_os.ilike.%${termo}%`];
      if (clientesMatch?.length) {
        condicoes.push(`cliente_id.in.(${clientesMatch.map((c) => c.id).join(",")})`);
      }
      if (equipamentosMatch?.length) {
        condicoes.push(`equipamento_id.in.(${equipamentosMatch.map((e) => e.id).join(",")})`);
      }
      query = query.or(condicoes.join(","));
    }

    if (status !== "todos") query = query.eq("status", status);
    if (prioridade !== "todos") query = query.eq("prioridade", prioridade);
    if (tecnicoId) query = query.eq("tecnico_responsavel", tecnicoId);
    if (clienteId) query = query.eq("cliente_id", clienteId);
    if (dataDe) query = query.gte("data_entrada", dataDe);
    if (dataAte) query = query.lte("data_entrada", dataAte);

    query = query.order(ordenarPor, { ascending: ordem === "asc" });

    const from = (pagina - 1) * porPagina;
    query = query.range(from, from + porPagina - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: data ?? [], total: count ?? 0 };
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from("ordens_servico")
      .select("*, clientes(*), equipamentos(*), os_eventos(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  create: async (payload: Database["public"]["Tables"]["ordens_servico"]["Insert"]) => {
    const { data, error } = await supabase.from("ordens_servico").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (id: string, payload: Database["public"]["Tables"]["ordens_servico"]["Update"]) => {
    const { data, error } = await supabase
      .from("ordens_servico")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  softDelete: async (id: string) => {
    const { error } = await supabase
      .from("ordens_servico")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export type OrcamentosStatus = "todos" | StatusOrcamento;

export interface OrcamentosListParams {
  busca?: string;
  status?: OrcamentosStatus;
  clienteId?: string;
  osId?: string;
  ordenarPor?: "data_emissao" | "numero";
  ordem?: "asc" | "desc";
  pagina?: number;
  porPagina?: number;
}

export interface OrcamentosListResult {
  data: Database["public"]["Tables"]["orcamentos"]["Row"][];
  total: number;
}

export interface OrcamentoItemInput {
  tipo: Database["public"]["Tables"]["orcamento_itens"]["Row"]["tipo"];
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  desconto: number;
}

export const orcamentosService = {
  list: async (params: OrcamentosListParams = {}): Promise<OrcamentosListResult> => {
    const {
      busca,
      status = "todos",
      clienteId,
      osId,
      ordenarPor = "data_emissao",
      ordem = "desc",
      pagina = 1,
      porPagina = 10,
    } = params;

    let query = supabase
      .from("orcamentos")
      .select(
        "*, clientes(id, nome), equipamentos(id, tipo, marca, modelo), ordens_servico(id, numero_os)",
        {
          count: "exact",
        },
      )
      .is("deleted_at", null);

    if (busca?.trim()) {
      const termo = busca.trim();
      // PostgREST não filtra colunas de tabelas relacionadas dentro de um
      // .or() — resolve clientes/OS correspondentes antes.
      const [{ data: clientesMatch }, { data: ordensMatch }] = await Promise.all([
        supabase.from("clientes").select("id").ilike("nome", `%${termo}%`).limit(50),
        supabase.from("ordens_servico").select("id").ilike("numero_os", `%${termo}%`).limit(50),
      ]);

      const condicoes = [`numero.eq.${Number(termo) || 0}`];
      if (clientesMatch?.length) {
        condicoes.push(`cliente_id.in.(${clientesMatch.map((c) => c.id).join(",")})`);
      }
      if (ordensMatch?.length) {
        condicoes.push(`os_id.in.(${ordensMatch.map((o) => o.id).join(",")})`);
      }
      query = query.or(condicoes.join(","));
    }

    if (status !== "todos") query = query.eq("status", status);
    if (clienteId) query = query.eq("cliente_id", clienteId);
    if (osId) query = query.eq("os_id", osId);

    query = query.order(ordenarPor, { ascending: ordem === "asc" });

    const from = (pagina - 1) * porPagina;
    query = query.range(from, from + porPagina - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: data ?? [], total: count ?? 0 };
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from("orcamentos")
      .select(
        "*, clientes(*), equipamentos(*), ordens_servico(id, numero_os, problema_relatado), orcamento_itens(*), orcamento_eventos(*), orcamento_aprovacoes(*)",
      )
      .eq("id", id)
      .order("ordem", { referencedTable: "orcamento_itens" })
      .order("created_at", { referencedTable: "orcamento_aprovacoes", ascending: false })
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  create: async (payload: Database["public"]["Tables"]["orcamentos"]["Insert"]) => {
    const { data, error } = await supabase.from("orcamentos").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (id: string, payload: Database["public"]["Tables"]["orcamentos"]["Update"]) => {
    const { data, error } = await supabase
      .from("orcamentos")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  softDelete: async (id: string) => {
    const { error } = await supabase
      .from("orcamentos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  /** Substitui todos os itens do orçamento pela lista atual (a ordem do array vira o campo `ordem`). */
  salvarItens: async (orcamentoId: string, itens: OrcamentoItemInput[]) => {
    const { error: delError } = await supabase
      .from("orcamento_itens")
      .delete()
      .eq("orcamento_id", orcamentoId);
    if (delError) throw new Error(delError.message);

    if (!itens.length) return;

    const { error: insError } = await supabase.from("orcamento_itens").insert(
      itens.map((item, index) => ({
        ...item,
        orcamento_id: orcamentoId,
        ordem: index,
      })),
    );
    if (insError) throw new Error(insError.message);
  },

  duplicar: async (id: string) => {
    const original = await orcamentosService.get(id);
    if (!original) throw new Error("Orçamento não encontrado");

    const novo = await orcamentosService.create({
      os_id: original.os_id,
      status: "rascunho",
      validade_dias: original.validade_dias,
      prazo_entrega: original.prazo_entrega,
      condicoes_pagamento: original.condicoes_pagamento,
      observacoes: original.observacoes,
      desconto: original.desconto,
    });

    const itens = (original.orcamento_itens ?? []).map((item) => ({
      tipo: item.tipo,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      desconto: item.desconto,
    }));
    await orcamentosService.salvarItens(novo.id, itens);

    return novo;
  },

  /** Salva o PDF gerado no Storage (substituindo um anterior, se houver) e grava o caminho no orçamento. */
  salvarPdf: async (id: string, blob: Blob) => {
    const path = `${id}.pdf`;
    const file = new File([blob], path, { type: "application/pdf" });
    await storageService.remove(ORCAMENTO_PDFS_BUCKET, path);
    await storageService.upload(ORCAMENTO_PDFS_BUCKET, path, file);
    const { error } = await supabase
      .from("orcamentos")
      .update({ pdf_path: path, pdf_gerado_em: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return orcamentosService.pdfUrl(path);
  },

  pdfUrl: (path: string) => storageService.createSignedUrl(ORCAMENTO_PDFS_BUCKET, path),

  /**
   * Gera (ou renova) o link público de aprovação: cria um token novo, define a
   * expiração e limpa uma eventual revogação anterior. Um orçamento em
   * rascunho passa a "enviado", já que compartilhar o link implica enviá-lo.
   */
  gerarLinkPublico: async (id: string, statusAtual: StatusOrcamento, validadeDias: number) => {
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + validadeDias * 86_400_000);
    const payload: Database["public"]["Tables"]["orcamentos"]["Update"] = {
      token_publico: gerarTokenSeguro(),
      token_criado_em: agora.toISOString(),
      token_expira_em: expiraEm.toISOString(),
      token_revogado_em: null,
    };
    if (statusAtual === "rascunho") payload.status = "enviado";

    const { data, error } = await supabase
      .from("orcamentos")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  revogarLinkPublico: async (id: string) => {
    const { error } = await supabase
      .from("orcamentos")
      .update({ token_revogado_em: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};

/** Acesso público (sem login) usado pela página de aprovação — token é a única credencial. */
export const orcamentoPublicoService = {
  obter: async (token: string) => {
    const { data, error } = await supabase.rpc("obter_orcamento_publico", { p_token: token });
    if (error) throw new Error(error.message);
    return data as unknown as OrcamentoPublico;
  },

  registrarDecisao: async (params: {
    token: string;
    acao: AcaoAprovacaoOrcamento;
    mensagem: string | null;
    ip: string | null;
    userAgent: string | null;
  }) => {
    const { error } = await supabase.rpc("registrar_decisao_orcamento", {
      p_token: params.token,
      p_acao: params.acao,
      p_mensagem: params.mensagem,
      p_ip: params.ip,
      p_user_agent: params.userAgent,
    });
    if (error) throw new Error(error.message);
  },
};

export interface OrcamentoPublico {
  orcamento: {
    id: string;
    numero: number;
    ano: number;
    status: StatusOrcamento;
    validade_dias: number;
    data_emissao: string;
    data_aprovacao: string | null;
    subtotal: number;
    desconto: number;
    total: number;
    observacoes: string | null;
    pdf_path: string | null;
  };
  os: { numero_os: string | null } | null;
  cliente: { nome: string } | null;
  equipamento: {
    tipo: TipoEquipamento;
    marca: string | null;
    modelo: string | null;
    numero_serie: string | null;
  } | null;
  empresa: Pick<
    Database["public"]["Tables"]["empresa"]["Row"],
    | "nome_fantasia"
    | "cnpj"
    | "telefone"
    | "whatsapp"
    | "email"
    | "endereco"
    | "numero"
    | "bairro"
    | "cidade"
    | "uf"
    | "logo_url"
  > | null;
  itens: {
    tipo: Database["public"]["Tables"]["orcamento_itens"]["Row"]["tipo"];
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    desconto: number;
    subtotal: number | null;
  }[];
}

export const financeiroService = {
  list: async (tipo?: "entrada" | "saida") => {
    const base = supabase
      .from("lancamentos")
      .select("*, categorias_financeiras(id, nome), clientes(id, nome)")
      .is("deleted_at", null);
    const q = tipo ? base.eq("tipo", tipo) : base;
    return unwrap(await q.order("data_vencimento", { ascending: false }));
  },
  categorias: async () =>
    unwrap(await supabase.from("categorias_financeiras").select("*").order("nome")),
};

export const estoqueService = {
  produtos: async () =>
    unwrap(
      await supabase
        .from("produtos")
        .select("*, categorias_produto(id, nome), fornecedores(id, nome)")
        .is("deleted_at", null)
        .order("nome"),
    ),
  categorias: async () =>
    unwrap(await supabase.from("categorias_produto").select("*").order("nome")),
  fornecedores: async () =>
    unwrap(await supabase.from("fornecedores").select("*").is("deleted_at", null).order("nome")),
  movimentacoes: async () =>
    unwrap(
      await supabase
        .from("movimentacoes_estoque")
        .select("*, produtos(id, nome, unidade)")
        .order("created_at", { ascending: false })
        .limit(100),
    ),
};

export const agendaService = {
  list: async () =>
    unwrap(
      await supabase
        .from("agenda_eventos")
        .select("*, clientes(id, nome)")
        .is("deleted_at", null)
        .order("inicio"),
    ),
};

export const configService = {
  empresa: async () => {
    const { data, error } = await supabase.from("empresa").select("*").limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  usuarios: async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("nome"),
      supabase.from("user_roles").select("*"),
    ]);
    return (profiles ?? []).map((p) => ({
      ...p,
      roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
    }));
  },
};
