-- ============ ORCAMENTOS: aprovacao digital (PDF, link publico, registro) ============

ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS token_publico TEXT,
  ADD COLUMN IF NOT EXISTS token_criado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS token_expira_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS token_revogado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pdf_path TEXT,
  ADD COLUMN IF NOT EXISTS pdf_gerado_em TIMESTAMPTZ;

-- O token e gerado pelo app (Web Crypto, 24 bytes aleatorios em base64url) —
-- o indice unico so garante a integridade, nao gera o valor.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orc_token_publico
  ON public.orcamentos (token_publico)
  WHERE token_publico IS NOT NULL;

-- ============ AUDITORIA: aprovacao/reprovacao/pedido de alteracao pelo cliente ============

CREATE TYPE public.acao_aprovacao_orcamento AS ENUM ('aprovado', 'recusado', 'alteracao_solicitada');

CREATE TABLE public.orcamento_aprovacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  acao public.acao_aprovacao_orcamento NOT NULL,
  mensagem TEXT,
  ip TEXT,
  user_agent TEXT,
  token_utilizado TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orc_aprovacoes_orc ON public.orcamento_aprovacoes (orcamento_id, created_at DESC);

-- So a equipe interna le esta tabela; toda escrita acontece exclusivamente
-- pela function registrar_decisao_orcamento (SECURITY DEFINER, ver abaixo),
-- nunca por INSERT direto — nem authenticated nem anon tem GRANT de escrita.
GRANT SELECT ON public.orcamento_aprovacoes TO authenticated;
GRANT ALL ON public.orcamento_aprovacoes TO service_role;
ALTER TABLE public.orcamento_aprovacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orc_aprovacoes_auth_select" ON public.orcamento_aprovacoes
  FOR SELECT TO authenticated USING (true);

-- ============ STORAGE: PDF do orcamento ============

INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamento-pdfs', 'orcamento-pdfs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "orc_pdfs_storage_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'orcamento-pdfs');
CREATE POLICY "orc_pdfs_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'orcamento-pdfs');
CREATE POLICY "orc_pdfs_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'orcamento-pdfs');

-- ============ CASCATA: aprovar/reprovar atualiza a OS vinculada ============
-- so avanca a OS se ela ainda estiver numa etapa de espera por orcamento —
-- nao regride uma OS que ja avancou (ex.: ja entregue).

CREATE OR REPLACE FUNCTION public.sync_os_apos_decisao_orcamento()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'aprovado' THEN
    UPDATE public.ordens_servico
    SET status = 'em_manutencao'
    WHERE id = NEW.os_id AND status IN ('aguardando_orcamento', 'aguardando_aprovacao');
  ELSIF NEW.status = 'recusado' THEN
    UPDATE public.ordens_servico
    SET status = 'aguardando_orcamento'
    WHERE id = NEW.os_id AND status IN ('aguardando_orcamento', 'aguardando_aprovacao');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_orcamento_sync_os_status ON public.orcamentos;
CREATE TRIGGER trg_orcamento_sync_os_status
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('aprovado', 'recusado'))
  EXECUTE FUNCTION public.sync_os_apos_decisao_orcamento();

-- ============ RPCs PUBLICAS: leitura e decisao via token (sem login) ============
-- Ambas SECURITY DEFINER: o token e a unica credencial. Nenhuma tabela de
-- negocio recebe GRANT para anon — tudo passa por estas duas functions, que
-- decidem exatamente quais colunas expor.

CREATE OR REPLACE FUNCTION public.obter_orcamento_publico(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_orc RECORD;
  v_result JSONB;
BEGIN
  SELECT * INTO v_orc FROM public.orcamentos WHERE token_publico = p_token;

  IF NOT FOUND OR v_orc.token_revogado_em IS NOT NULL THEN
    RAISE EXCEPTION 'Link inválido, expirado ou revogado.';
  END IF;

  IF v_orc.token_expira_em IS NOT NULL AND v_orc.token_expira_em < now() THEN
    IF v_orc.status = 'enviado' THEN
      UPDATE public.orcamentos SET status = 'expirado' WHERE id = v_orc.id;
    END IF;
    RAISE EXCEPTION 'Link inválido, expirado ou revogado.';
  END IF;

  SELECT jsonb_build_object(
    'orcamento', jsonb_build_object(
      'id', o.id,
      'numero', o.numero,
      'ano', o.ano,
      'status', o.status,
      'validade_dias', o.validade_dias,
      'data_emissao', o.data_emissao,
      'data_aprovacao', o.data_aprovacao,
      'subtotal', o.subtotal,
      'desconto', o.desconto,
      'total', o.total,
      'observacoes', o.observacoes,
      'pdf_path', o.pdf_path
    ),
    'os', (
      SELECT jsonb_build_object('numero_os', os.numero_os)
      FROM public.ordens_servico os WHERE os.id = o.os_id
    ),
    'cliente', (
      SELECT jsonb_build_object('nome', c.nome)
      FROM public.clientes c WHERE c.id = o.cliente_id
    ),
    'equipamento', (
      SELECT jsonb_build_object(
        'tipo', e.tipo, 'marca', e.marca, 'modelo', e.modelo, 'numero_serie', e.numero_serie
      )
      FROM public.equipamentos e WHERE e.id = o.equipamento_id
    ),
    'empresa', (
      SELECT jsonb_build_object(
        'nome_fantasia', em.nome_fantasia, 'cnpj', em.cnpj, 'telefone', em.telefone,
        'whatsapp', em.whatsapp, 'email', em.email, 'endereco', em.endereco,
        'numero', em.numero, 'bairro', em.bairro, 'cidade', em.cidade, 'uf', em.uf,
        'logo_url', em.logo_url
      )
      FROM public.empresa em LIMIT 1
    ),
    'itens', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'tipo', i.tipo, 'descricao', i.descricao, 'quantidade', i.quantidade,
        'valor_unitario', i.valor_unitario, 'desconto', i.desconto, 'subtotal', i.subtotal
      ) ORDER BY i.ordem), '[]'::jsonb)
      FROM public.orcamento_itens i WHERE i.orcamento_id = o.id
    )
  ) INTO v_result
  FROM public.orcamentos o WHERE o.id = v_orc.id;

  RETURN v_result;
END; $$;

GRANT EXECUTE ON FUNCTION public.obter_orcamento_publico(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.registrar_decisao_orcamento(
  p_token TEXT,
  p_acao public.acao_aprovacao_orcamento,
  p_mensagem TEXT,
  p_ip TEXT,
  p_user_agent TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_orc RECORD;
BEGIN
  SELECT * INTO v_orc FROM public.orcamentos WHERE token_publico = p_token;

  IF NOT FOUND
     OR v_orc.token_revogado_em IS NOT NULL
     OR (v_orc.token_expira_em IS NOT NULL AND v_orc.token_expira_em < now())
  THEN
    RAISE EXCEPTION 'Link inválido, expirado ou revogado.';
  END IF;

  IF v_orc.status IN ('aprovado', 'recusado', 'cancelado', 'expirado') THEN
    RAISE EXCEPTION 'Este orçamento já foi respondido e não pode ser alterado.';
  END IF;

  INSERT INTO public.orcamento_aprovacoes (orcamento_id, acao, mensagem, ip, user_agent, token_utilizado)
  VALUES (v_orc.id, p_acao, NULLIF(TRIM(p_mensagem), ''), p_ip, p_user_agent, p_token);

  IF p_acao = 'aprovado' THEN
    UPDATE public.orcamentos SET status = 'aprovado', data_aprovacao = now() WHERE id = v_orc.id;
  ELSIF p_acao = 'recusado' THEN
    UPDATE public.orcamentos SET status = 'recusado' WHERE id = v_orc.id;
  END IF;
  -- 'alteracao_solicitada' so registra o pedido; o status do orcamento nao muda.

  RETURN jsonb_build_object('ok', true);
END; $$;

GRANT EXECUTE ON FUNCTION public.registrar_decisao_orcamento(TEXT, public.acao_aprovacao_orcamento, TEXT, TEXT, TEXT)
  TO anon, authenticated;
