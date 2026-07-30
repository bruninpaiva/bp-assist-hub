import { z } from "zod";
import { maskCEP, maskCNPJ, maskCPF, maskTelefone, onlyDigits } from "@/lib/masks";
import { isValidCNPJ, isValidCPF } from "@/lib/validators";
import type { Database } from "@/integrations/supabase/types";
import type { Cliente } from "@/types/domain";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const clienteSchema = z
  .object({
    tipo_pessoa: z.enum(["fisica", "juridica"]),
    nome: z.string().trim().min(2, "Informe o nome").max(180),
    razao_social: optionalText(180),
    nome_fantasia: optionalText(180),
    cpf: z.string().optional().or(z.literal("")),
    cnpj: z.string().optional().or(z.literal("")),
    inscricao_estadual: optionalText(30),
    email: z.string().trim().email("E-mail inválido").max(180).optional().or(z.literal("")),
    telefone: z.string().optional().or(z.literal("")),
    whatsapp: z.string().optional().or(z.literal("")),
    cep: z.string().optional().or(z.literal("")),
    endereco: optionalText(180),
    numero: optionalText(20),
    bairro: optionalText(120),
    cidade: optionalText(120),
    uf: optionalText(2),
    complemento: optionalText(120),
    observacoes: optionalText(2000),
    ativo: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.tipo_pessoa === "fisica") {
      const digits = onlyDigits(values.cpf);
      if (!digits) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cpf"], message: "Informe o CPF" });
      } else if (!isValidCPF(digits)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cpf"], message: "CPF inválido" });
      }
    } else {
      if (!values.razao_social?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["razao_social"],
          message: "Informe a razão social",
        });
      }
      const digits = onlyDigits(values.cnpj);
      if (!digits) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cnpj"], message: "Informe o CNPJ" });
      } else if (!isValidCNPJ(digits)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cnpj"], message: "CNPJ inválido" });
      }
    }
  });

export type ClienteFormValues = z.infer<typeof clienteSchema>;

export const defaultClienteFormValues: ClienteFormValues = {
  tipo_pessoa: "fisica",
  nome: "",
  razao_social: "",
  nome_fantasia: "",
  cpf: "",
  cnpj: "",
  inscricao_estadual: "",
  email: "",
  telefone: "",
  whatsapp: "",
  cep: "",
  endereco: "",
  numero: "",
  bairro: "",
  cidade: "",
  uf: "",
  complemento: "",
  observacoes: "",
  ativo: true,
};

export function clienteToFormValues(cliente: Cliente): ClienteFormValues {
  return {
    tipo_pessoa: cliente.tipo_pessoa,
    nome: cliente.nome,
    razao_social: cliente.razao_social ?? "",
    nome_fantasia: cliente.nome_fantasia ?? "",
    cpf: cliente.cpf ? maskCPF(cliente.cpf) : "",
    cnpj: cliente.cnpj ? maskCNPJ(cliente.cnpj) : "",
    inscricao_estadual: cliente.inscricao_estadual ?? "",
    email: cliente.email ?? "",
    telefone: cliente.telefone ? maskTelefone(cliente.telefone) : "",
    whatsapp: cliente.whatsapp ? maskTelefone(cliente.whatsapp) : "",
    cep: cliente.cep ? maskCEP(cliente.cep) : "",
    endereco: cliente.endereco ?? "",
    numero: cliente.numero ?? "",
    bairro: cliente.bairro ?? "",
    cidade: cliente.cidade ?? "",
    uf: cliente.uf ?? "",
    complemento: cliente.complemento ?? "",
    observacoes: cliente.observacoes ?? "",
    ativo: cliente.ativo,
  };
}

export function toClientePayload(
  values: ClienteFormValues,
): Database["public"]["Tables"]["clientes"]["Insert"] {
  const emptyToNull = (v?: string) => (v?.trim() ? v.trim() : null);

  return {
    tipo_pessoa: values.tipo_pessoa,
    nome: values.nome.trim(),
    razao_social: emptyToNull(values.razao_social),
    nome_fantasia: emptyToNull(values.nome_fantasia),
    cpf: values.tipo_pessoa === "fisica" ? onlyDigits(values.cpf) : null,
    cnpj: values.tipo_pessoa === "juridica" ? onlyDigits(values.cnpj) : null,
    inscricao_estadual: emptyToNull(values.inscricao_estadual),
    email: emptyToNull(values.email),
    telefone: onlyDigits(values.telefone) || null,
    whatsapp: onlyDigits(values.whatsapp) || null,
    cep: onlyDigits(values.cep) || null,
    endereco: emptyToNull(values.endereco),
    numero: emptyToNull(values.numero),
    bairro: emptyToNull(values.bairro),
    cidade: emptyToNull(values.cidade),
    uf: emptyToNull(values.uf)?.toUpperCase() ?? null,
    complemento: emptyToNull(values.complemento),
    observacoes: emptyToNull(values.observacoes),
    ativo: values.ativo,
  };
}
