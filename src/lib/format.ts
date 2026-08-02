import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const brl = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));

export const numero = (value: number | string | null | undefined, digits = 0) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value ?? 0));

const toDate = (value: string | Date | null | undefined) => {
  if (!value) return null;
  return typeof value === "string" ? parseISO(value) : value;
};

export const dataCurta = (value: string | Date | null | undefined) => {
  const d = toDate(value);
  return d ? format(d, "dd/MM/yyyy", { locale: ptBR }) : "—";
};

export const dataHora = (value: string | Date | null | undefined) => {
  const d = toDate(value);
  return d ? format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—";
};

export const desde = (value: string | Date | null | undefined) => {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { locale: ptBR, addSuffix: true }) : "—";
};

export const documento = (value: string | null | undefined) => value?.trim() || "—";

export const iniciais = (nome: string | null | undefined) =>
  (nome ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "BP";
