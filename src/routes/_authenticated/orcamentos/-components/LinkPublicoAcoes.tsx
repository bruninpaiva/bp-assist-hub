import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingState } from "@/components/common/LoadingState";
import { orcamentosService, queryKeys } from "@/services/queries";
import type { OrcamentoComRelacoes } from "@/types/domain";

function linkPublicoDe(token: string) {
  return `${window.location.origin}/orcamento/${token}`;
}

export function LinkPublicoAcoes({ orcamento }: { orcamento: OrcamentoComRelacoes }) {
  const queryClient = useQueryClient();
  const [linkGerado, setLinkGerado] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [revogando, setRevogando] = useState(false);

  const tokenAtivo =
    !!orcamento.token_publico &&
    !orcamento.token_revogado_em &&
    (!orcamento.token_expira_em || new Date(orcamento.token_expira_em) > new Date());

  const copiarLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência");
  };

  const handleGerar = async () => {
    setGerando(true);
    try {
      const atualizado = await orcamentosService.gerarLinkPublico(
        orcamento.id,
        orcamento.status,
        orcamento.validade_dias,
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.orcamento(orcamento.id) });
      await queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      setLinkGerado(linkPublicoDe(atualizado.token_publico!));
      toast.success("Link de aprovação gerado");
    } catch (error) {
      toast.error("Não foi possível gerar o link", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setGerando(false);
    }
  };

  const handleRevogar = async () => {
    setRevogando(true);
    try {
      await orcamentosService.revogarLinkPublico(orcamento.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.orcamento(orcamento.id) });
      toast.success("Link revogado — ele deixa de funcionar imediatamente");
    } catch (error) {
      toast.error("Não foi possível revogar o link", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setRevogando(false);
    }
  };

  return (
    <>
      {tokenAtivo ? (
        <>
          <Button
            variant="outline"
            onClick={() => void copiarLink(linkPublicoDe(orcamento.token_publico!))}
          >
            <LinkIcon className="size-4" /> Copiar link público
          </Button>
          <Button variant="outline" onClick={() => void handleRevogar()} disabled={revogando}>
            {revogando ? <LoadingState /> : <Ban className="size-4" />} Revogar link
          </Button>
        </>
      ) : (
        <Button variant="outline" onClick={() => void handleGerar()} disabled={gerando}>
          {gerando ? <LoadingState /> : <LinkIcon className="size-4" />} Gerar link público
        </Button>
      )}

      <Dialog open={linkGerado !== null} onOpenChange={(open) => !open && setLinkGerado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de aprovação gerado</DialogTitle>
            <DialogDescription>
              Compartilhe este link com o cliente. Ele poderá aprovar, reprovar ou solicitar
              alterações sem precisar de login.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={linkGerado ?? ""} onFocus={(e) => e.currentTarget.select()} />
            <Button type="button" onClick={() => linkGerado && void copiarLink(linkGerado)}>
              Copiar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
