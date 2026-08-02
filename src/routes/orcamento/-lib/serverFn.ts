import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { orcamentoPublicoService } from "@/services/queries";
import type { OrcamentoPublico } from "@/services/queries";

const tokenSchema = z.object({ token: z.string().min(1) });

/** TTL da signed URL do PDF entregue ao cliente na página pública. */
const PDF_SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Leitura pública do orçamento. A validação do token acontece dentro da RPC
 * `obter_orcamento_publico` (SECURITY DEFINER) e só depois — no servidor — é
 * gerada a signed URL do PDF. O bucket `orcamento-pdfs` não é mais legível por
 * anônimos, então conhecer o caminho do arquivo deixa de dar acesso a ele.
 */
export const obterOrcamentoPublicoFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => tokenSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rpcData, error } = await supabaseAdmin.rpc("obter_orcamento_publico", {
      p_token: data.token,
    });
    if (error) throw new Error(error.message);

    const orcamento = rpcData as unknown as OrcamentoPublico;

    let pdfUrl: string | null = null;
    const pdfPath = orcamento.orcamento.pdf_path;
    if (pdfPath) {
      const { data: signed } = await supabaseAdmin.storage
        .from("orcamento-pdfs")
        .createSignedUrl(pdfPath, PDF_SIGNED_URL_TTL_SECONDS);
      pdfUrl = signed?.signedUrl ?? null;
    }

    return { ...orcamento, pdf_url: pdfUrl };
  });

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
