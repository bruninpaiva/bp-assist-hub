import { onlyDigits } from "@/lib/masks";

export interface ViaCepResult {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepResult | null> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) throw new Error("Não foi possível consultar o CEP.");

  const data = (await response.json()) as ViaCepResult;
  if (data.erro) return null;
  return data;
}
