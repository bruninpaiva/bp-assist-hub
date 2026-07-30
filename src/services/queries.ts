import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { onlyDigits } from "@/lib/masks";
import type { Cliente, TipoPessoa } from "@/types/domain";

export const queryKeys = {
  clientes: (params?: ClientesListParams) => ["clientes", params ?? {}] as const,
  cliente: (id: string) => ["clientes", id] as const,
  equipamentos: ["equipamentos"] as const,
  ordens: ["ordens"] as const,
  ordem: (id: string) => ["ordens", id] as const,
  orcamentos: ["orcamentos"] as const,
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

export const equipamentosService = {
  list: async () =>
    unwrap(
      await supabase
        .from("equipamentos")
        .select("*, clientes(id, nome)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    ),
};

export const ordensService = {
  list: async () =>
    unwrap(
      await supabase
        .from("ordens_servico")
        .select("*, clientes(id, nome), equipamentos(id, tipo, marca, modelo)")
        .is("deleted_at", null)
        .order("numero", { ascending: false }),
    ),
  get: async (id: string) => {
    const { data, error } = await supabase
      .from("ordens_servico")
      .select("*, clientes(*), equipamentos(*), os_eventos(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
};

export const orcamentosService = {
  list: async () =>
    unwrap(
      await supabase
        .from("orcamentos")
        .select("*, clientes(id, nome)")
        .is("deleted_at", null)
        .order("numero", { ascending: false }),
    ),
  get: async (id: string) => {
    const { data, error } = await supabase
      .from("orcamentos")
      .select("*, clientes(*), orcamento_itens(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
};

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
