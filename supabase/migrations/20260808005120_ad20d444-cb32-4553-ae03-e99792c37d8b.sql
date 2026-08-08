-- ============ ENUMS ============
CREATE TYPE public.tipo_movimentacao_estoque AS ENUM (
  'entrada','saida','reserva','liberacao_reserva','uso_os','ajuste_positivo','ajuste_negativo','devolucao','ajuste'
);

CREATE TYPE public.situacao_peca_os AS ENUM ('reservada','utilizada','removida','devolvida');

-- ============ PRODUTOS ============
CREATE SEQUENCE IF NOT EXISTS public.produtos_codigo_seq;

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS codigo TEXT NOT NULL DEFAULT ('P-' || lpad(nextval('public.produtos_codigo_seq')::text, 5, '0')),
  ADD COLUMN IF NOT EXISTS marca TEXT,
  ADD COLUMN IF NOT EXISTS modelo TEXT,
  ADD COLUMN IF NOT EXISTS sku_fabricante TEXT,
  ADD COLUMN IF NOT EXISTS localizacao TEXT,
  ADD COLUMN IF NOT EXISTS observacoes TEXT,
  ADD COLUMN IF NOT EXISTS custo_medio NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estoque_reservado NUMERIC NOT NULL DEFAULT 0;

UPDATE public.produtos SET custo_medio = preco_custo WHERE custo_medio = 0;

CREATE UNIQUE INDEX IF NOT EXISTS produtos_codigo_key ON public.produtos (codigo);
CREATE INDEX IF NOT EXISTS produtos_nome_idx ON public.produtos (nome);
CREATE INDEX IF NOT EXISTS produtos_marca_idx ON public.produtos (marca);
CREATE INDEX IF NOT EXISTS produtos_categoria_idx ON public.produtos (categoria_id);
CREATE INDEX IF NOT EXISTS produtos_ativo_idx ON public.produtos (ativo);

-- ============ MOVIMENTACOES ============
ALTER TABLE public.movimentacoes_estoque
  ALTER COLUMN tipo TYPE public.tipo_movimentacao_estoque
  USING tipo::text::public.tipo_movimentacao_estoque;

ALTER TABLE public.movimentacoes_estoque
  ADD COLUMN IF NOT EXISTS motivo TEXT,
  ADD COLUMN IF NOT EXISTS documento TEXT,
  ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES public.fornecedores(id),
  ADD COLUMN IF NOT EXISTS data_compra DATE,
  ADD COLUMN IF NOT EXISTS custo_medio_anterior NUMERIC,
  ADD COLUMN IF NOT EXISTS custo_medio_novo NUMERIC,
  ADD COLUMN IF NOT EXISTS estoque_anterior NUMERIC,
  ADD COLUMN IF NOT EXISTS estoque_novo NUMERIC;

CREATE INDEX IF NOT EXISTS movimentacoes_produto_idx ON public.movimentacoes_estoque (produto_id, created_at DESC);
CREATE INDEX IF NOT EXISTS movimentacoes_os_idx ON public.movimentacoes_estoque (os_id);

-- histórico é imutável pela aplicação: escrita só pelas rotinas SECURITY DEFINER
DROP POLICY IF EXISTS "Autenticados gerenciam movimentacoes" ON public.movimentacoes_estoque;
DROP POLICY IF EXISTS "auth_all_movimentacoes_estoque" ON public.movimentacoes_estoque;
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='movimentacoes_estoque'
  LOOP EXECUTE format('DROP POLICY %I ON public.movimentacoes_estoque', p.policyname); END LOOP;
END $$;
REVOKE INSERT, UPDATE, DELETE ON public.movimentacoes_estoque FROM authenticated, anon;
GRANT SELECT ON public.movimentacoes_estoque TO authenticated;
GRANT ALL ON public.movimentacoes_estoque TO service_role;
CREATE POLICY "Autenticados leem movimentacoes" ON public.movimentacoes_estoque
  FOR SELECT TO authenticated USING (true);

-- ============ PECAS DA OS ============
CREATE TABLE IF NOT EXISTS public.os_pecas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  quantidade NUMERIC NOT NULL CHECK (quantidade > 0),
  custo_unitario NUMERIC NOT NULL DEFAULT 0,
  preco_unitario NUMERIC NOT NULL DEFAULT 0,
  situacao public.situacao_peca_os NOT NULL DEFAULT 'reservada',
  observacao TEXT,
  motivo_devolucao TEXT,
  utilizada_em TIMESTAMPTZ,
  devolvida_em TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.os_pecas TO authenticated;
GRANT ALL ON public.os_pecas TO service_role;
ALTER TABLE public.os_pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem pecas da OS" ON public.os_pecas
  FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS os_pecas_os_idx ON public.os_pecas (os_id);
CREATE INDEX IF NOT EXISTS os_pecas_produto_idx ON public.os_pecas (produto_id);

CREATE TRIGGER trg_os_pecas_updated BEFORE UPDATE ON public.os_pecas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.movimentacoes_estoque
  ADD COLUMN IF NOT EXISTS os_peca_id UUID REFERENCES public.os_pecas(id) ON DELETE SET NULL;

-- ============ ORCAMENTO x PRODUTO ============
ALTER TABLE public.orcamento_itens
  ADD COLUMN IF NOT EXISTS produto_id UUID REFERENCES public.produtos(id);

-- ============ ROTINAS ATOMICAS ============
CREATE OR REPLACE FUNCTION public.registrar_entrada_estoque(
  p_produto_id UUID, p_quantidade NUMERIC, p_valor_unitario NUMERIC,
  p_fornecedor_id UUID DEFAULT NULL, p_documento TEXT DEFAULT NULL,
  p_data_compra DATE DEFAULT NULL, p_observacao TEXT DEFAULT NULL
) RETURNS public.produtos LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_p public.produtos; v_novo_custo NUMERIC; v_ant NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_quantidade IS NULL OR p_quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade deve ser maior que zero'; END IF;
  IF p_valor_unitario IS NULL OR p_valor_unitario < 0 THEN RAISE EXCEPTION 'Valor unitário inválido'; END IF;

  SELECT * INTO v_p FROM public.produtos WHERE id = p_produto_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;

  v_ant := v_p.custo_medio;
  IF v_p.estoque_atual + p_quantidade > 0 THEN
    v_novo_custo := ((GREATEST(v_p.estoque_atual,0) * v_p.custo_medio) + (p_quantidade * p_valor_unitario))
                    / (GREATEST(v_p.estoque_atual,0) + p_quantidade);
  ELSE
    v_novo_custo := p_valor_unitario;
  END IF;

  UPDATE public.produtos
     SET estoque_atual = estoque_atual + p_quantidade,
         custo_medio = round(v_novo_custo, 4),
         preco_custo = round(v_novo_custo, 4)
   WHERE id = p_produto_id
   RETURNING * INTO v_p;

  INSERT INTO public.movimentacoes_estoque
    (produto_id, tipo, quantidade, custo_unitario, usuario_id, observacoes, documento,
     fornecedor_id, data_compra, custo_medio_anterior, custo_medio_novo,
     estoque_anterior, estoque_novo)
  VALUES (p_produto_id, 'entrada', p_quantidade, p_valor_unitario, auth.uid(), p_observacao, p_documento,
          p_fornecedor_id, COALESCE(p_data_compra, CURRENT_DATE), v_ant, v_p.custo_medio,
          v_p.estoque_atual - p_quantidade, v_p.estoque_atual);

  RETURN v_p;
END; $$;

CREATE OR REPLACE FUNCTION public.ajustar_estoque(
  p_produto_id UUID, p_quantidade NUMERIC, p_sentido TEXT, p_motivo TEXT
) RETURNS public.produtos LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_p public.produtos; v_ant NUMERIC; v_delta NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_quantidade IS NULL OR p_quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade deve ser maior que zero'; END IF;
  IF COALESCE(TRIM(p_motivo),'') = '' THEN RAISE EXCEPTION 'Motivo é obrigatório'; END IF;
  IF p_sentido NOT IN ('entrada','saida') THEN RAISE EXCEPTION 'Sentido inválido'; END IF;

  SELECT * INTO v_p FROM public.produtos WHERE id = p_produto_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;

  v_ant := v_p.estoque_atual;
  v_delta := CASE WHEN p_sentido = 'entrada' THEN p_quantidade ELSE -p_quantidade END;

  IF v_ant + v_delta < v_p.estoque_reservado THEN
    RAISE EXCEPTION 'Ajuste deixaria o estoque abaixo da quantidade já reservada (%).', v_p.estoque_reservado;
  END IF;

  UPDATE public.produtos SET estoque_atual = estoque_atual + v_delta WHERE id = p_produto_id RETURNING * INTO v_p;

  INSERT INTO public.movimentacoes_estoque
    (produto_id, tipo, quantidade, custo_unitario, usuario_id, motivo, estoque_anterior, estoque_novo)
  VALUES (p_produto_id,
          CASE WHEN p_sentido = 'entrada' THEN 'ajuste_positivo' ELSE 'ajuste_negativo' END::public.tipo_movimentacao_estoque,
          p_quantidade, v_p.custo_medio, auth.uid(), TRIM(p_motivo), v_ant, v_p.estoque_atual);

  RETURN v_p;
END; $$;

CREATE OR REPLACE FUNCTION public.reservar_peca_os(
  p_os_id UUID, p_produto_id UUID, p_quantidade NUMERIC, p_preco_unitario NUMERIC DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL
) RETURNS public.os_pecas LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_p public.produtos; v_peca public.os_pecas; v_disp NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_quantidade IS NULL OR p_quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade deve ser maior que zero'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.ordens_servico WHERE id = p_os_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Ordem de serviço não encontrada';
  END IF;

  SELECT * INTO v_p FROM public.produtos WHERE id = p_produto_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;

  v_disp := v_p.estoque_atual - v_p.estoque_reservado;
  IF p_quantidade > v_disp THEN
    RAISE EXCEPTION 'Estoque disponível insuficiente. Disponível: %', v_disp;
  END IF;

  UPDATE public.produtos SET estoque_reservado = estoque_reservado + p_quantidade WHERE id = p_produto_id;

  INSERT INTO public.os_pecas (os_id, produto_id, quantidade, custo_unitario, preco_unitario, situacao, observacao, created_by)
  VALUES (p_os_id, p_produto_id, p_quantidade, v_p.custo_medio,
          COALESCE(p_preco_unitario, v_p.preco_venda), 'reservada', p_observacao, auth.uid())
  RETURNING * INTO v_peca;

  INSERT INTO public.movimentacoes_estoque
    (produto_id, tipo, quantidade, custo_unitario, os_id, os_peca_id, usuario_id, observacoes,
     estoque_anterior, estoque_novo)
  VALUES (p_produto_id, 'reserva', p_quantidade, v_p.custo_medio, p_os_id, v_peca.id, auth.uid(), p_observacao,
          v_p.estoque_atual, v_p.estoque_atual);

  RETURN v_peca;
END; $$;

CREATE OR REPLACE FUNCTION public.remover_peca_os(p_peca_id UUID, p_motivo TEXT DEFAULT NULL)
RETURNS public.os_pecas LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_peca public.os_pecas; v_p public.produtos;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_peca FROM public.os_pecas WHERE id = p_peca_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Peça não encontrada'; END IF;
  IF v_peca.situacao <> 'reservada' THEN RAISE EXCEPTION 'Somente peças reservadas podem ser removidas'; END IF;

  SELECT * INTO v_p FROM public.produtos WHERE id = v_peca.produto_id FOR UPDATE;

  UPDATE public.produtos SET estoque_reservado = GREATEST(estoque_reservado - v_peca.quantidade, 0)
   WHERE id = v_peca.produto_id;

  UPDATE public.os_pecas SET situacao = 'removida' WHERE id = p_peca_id RETURNING * INTO v_peca;

  INSERT INTO public.movimentacoes_estoque
    (produto_id, tipo, quantidade, custo_unitario, os_id, os_peca_id, usuario_id, motivo,
     estoque_anterior, estoque_novo)
  VALUES (v_peca.produto_id, 'liberacao_reserva', v_peca.quantidade, v_peca.custo_unitario, v_peca.os_id,
          v_peca.id, auth.uid(), p_motivo, v_p.estoque_atual, v_p.estoque_atual);

  RETURN v_peca;
END; $$;

CREATE OR REPLACE FUNCTION public.confirmar_uso_peca_os(p_peca_id UUID)
RETURNS public.os_pecas LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_peca public.os_pecas; v_p public.produtos; v_ant NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_peca FROM public.os_pecas WHERE id = p_peca_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Peça não encontrada'; END IF;
  IF v_peca.situacao <> 'reservada' THEN RAISE EXCEPTION 'Somente peças reservadas podem ser utilizadas'; END IF;

  SELECT * INTO v_p FROM public.produtos WHERE id = v_peca.produto_id FOR UPDATE;
  IF v_p.estoque_atual < v_peca.quantidade THEN RAISE EXCEPTION 'Estoque insuficiente para baixa'; END IF;
  v_ant := v_p.estoque_atual;

  UPDATE public.produtos
     SET estoque_atual = estoque_atual - v_peca.quantidade,
         estoque_reservado = GREATEST(estoque_reservado - v_peca.quantidade, 0)
   WHERE id = v_peca.produto_id;

  UPDATE public.os_pecas SET situacao = 'utilizada', utilizada_em = now() WHERE id = p_peca_id RETURNING * INTO v_peca;

  INSERT INTO public.movimentacoes_estoque
    (produto_id, tipo, quantidade, custo_unitario, os_id, os_peca_id, usuario_id,
     estoque_anterior, estoque_novo)
  VALUES (v_peca.produto_id, 'uso_os', v_peca.quantidade, v_peca.custo_unitario, v_peca.os_id, v_peca.id,
          auth.uid(), v_ant, v_ant - v_peca.quantidade);

  RETURN v_peca;
END; $$;

CREATE OR REPLACE FUNCTION public.devolver_peca_os(p_peca_id UUID, p_motivo TEXT)
RETURNS public.os_pecas LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_peca public.os_pecas; v_ant NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF COALESCE(TRIM(p_motivo),'') = '' THEN RAISE EXCEPTION 'Motivo é obrigatório'; END IF;

  SELECT * INTO v_peca FROM public.os_pecas WHERE id = p_peca_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Peça não encontrada'; END IF;
  IF v_peca.situacao <> 'utilizada' THEN RAISE EXCEPTION 'Somente peças utilizadas podem ser devolvidas'; END IF;

  SELECT estoque_atual INTO v_ant FROM public.produtos WHERE id = v_peca.produto_id FOR UPDATE;

  UPDATE public.produtos SET estoque_atual = estoque_atual + v_peca.quantidade WHERE id = v_peca.produto_id;

  UPDATE public.os_pecas SET situacao = 'devolvida', devolvida_em = now(), motivo_devolucao = TRIM(p_motivo)
   WHERE id = p_peca_id RETURNING * INTO v_peca;

  INSERT INTO public.movimentacoes_estoque
    (produto_id, tipo, quantidade, custo_unitario, os_id, os_peca_id, usuario_id, motivo,
     estoque_anterior, estoque_novo)
  VALUES (v_peca.produto_id, 'devolucao', v_peca.quantidade, v_peca.custo_unitario, v_peca.os_id, v_peca.id,
          auth.uid(), TRIM(p_motivo), v_ant, v_ant + v_peca.quantidade);

  RETURN v_peca;
END; $$;

-- Impede exclusão física de produto com histórico
CREATE OR REPLACE FUNCTION public.bloquear_delete_produto_com_historico()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.movimentacoes_estoque WHERE produto_id = OLD.id)
     OR EXISTS (SELECT 1 FROM public.os_pecas WHERE produto_id = OLD.id) THEN
    RAISE EXCEPTION 'Produto possui histórico e não pode ser excluído. Inative-o.';
  END IF;
  RETURN OLD;
END; $$;

CREATE TRIGGER trg_produtos_bloqueia_delete BEFORE DELETE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_delete_produto_com_historico();

REVOKE ALL ON FUNCTION public.registrar_entrada_estoque(UUID,NUMERIC,NUMERIC,UUID,TEXT,DATE,TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ajustar_estoque(UUID,NUMERIC,TEXT,TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reservar_peca_os(UUID,UUID,NUMERIC,NUMERIC,TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remover_peca_os(UUID,TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.confirmar_uso_peca_os(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.devolver_peca_os(UUID,TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.registrar_entrada_estoque(UUID,NUMERIC,NUMERIC,UUID,TEXT,DATE,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ajustar_estoque(UUID,NUMERIC,TEXT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reservar_peca_os(UUID,UUID,NUMERIC,NUMERIC,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remover_peca_os(UUID,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_uso_peca_os(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.devolver_peca_os(UUID,TEXT) TO authenticated;