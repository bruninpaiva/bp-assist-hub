import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { orcamentoPublicoService } from "@/services/queries";

const decisaoSchema = z.object({
  token: z.string().min(1),
  acao: z.enum(["aprovado", "recusado", "alteracao_solicitada"]),
  mensagem: z.string().trim().max(2000).optional(),
});

/**
 * Único trecho de servidor do fluxo público: o IP real do cliente só existe
 * na requisição HTTP, então a decisão precisa passar por aqui antes de
 * chamar a RPC (que já revalida o token de forma independente).
 */
export const registrarDecisaoOrcamentoFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => decisaoSchema.parse(input))
  .handler(async ({ data }) => {
    const ip = getRequestIP({ xForwardedFor: true }) ?? null;
    const userAgent = getRequestHeader("user-agent") ?? null;

    await orcamentoPublicoService.registrarDecisao({
      token: data.token,
      acao: data.acao,
      mensagem: data.mensagem ?? null,
      ip,
      userAgent,
    });

    return { ok: true as const };
  });
