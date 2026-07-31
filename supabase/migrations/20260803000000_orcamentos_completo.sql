-- ============ ORCAMENTOS: completa o modulo sem quebrar compatibilidade ============

-- "Reprovado" reaproveita o valor 'recusado' ja existente (so muda o rotulo,
-- em lib/labels.ts) para nao invalidar dados/enum existentes. 'cancelado' e
-- realmente novo.
ALTER TYPE public.status_orcamento ADD VALUE IF NOT EXISTS 'cancelado';

-- Agora toda OS pode ter varios orcamentos, mas o vinculo com a OS passa a
-- ser obrigatorio (antes o orcamento era ligado direto ao cliente, com OS
-- opcional). cliente_id/equipamento_id continuam existindo como copia
-- denormalizada (o segundo e novo), sincronizada automaticamente a partir
-- da OS por trigger — nunca preenchida a mao.
ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS equipamento_id UUID REFERENCES public.equipamentos(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) NOT NULL DEFAULT 0;

-- cliente_id/equipamento_id continuam nullable no schema (o trigger abaixo
-- sempre os preenche a partir da OS, mas nao exigimos isso no tipo de
-- insercao — quem cria um orcamento so precisa informar o os_id).
ALTER TABLE public.orcamentos
  ALTER COLUMN os_id SET NOT NULL;

ALTER TABLE public.orcamentos
  DROP CONSTRAINT IF EXISTS orcamentos_os_id_fkey,
  DROP CONSTRAINT IF EXISTS orcamentos_cliente_id_fkey;

ALTER TABLE public.orcamentos
  ADD CONSTRAINT orcamentos_os_id_fkey
    FOREIGN KEY (os_id) REFERENCES public.ordens_servico(id) ON DELETE RESTRICT,
  ADD CONSTRAINT orcamentos_cliente_id_fkey
    FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_orc_os ON public.orcamentos (os_id);
CREATE INDEX IF NOT EXISTS idx_orc_equipamento ON public.orcamentos (equipamento_id);

-- So pode existir um orcamento aprovado por OS.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orc_aprovado_unico
  ON public.orcamentos (os_id)
  WHERE status = 'aprovado' AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.sync_orcamento_cliente_equipamento()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT cliente_id, equipamento_id INTO NEW.cliente_id, NEW.equipamento_id
  FROM public.ordens_servico WHERE id = NEW.os_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_orcamento_sync_cliente_equip ON public.orcamentos;
CREATE TRIGGER trg_orcamento_sync_cliente_equip
  BEFORE INSERT OR UPDATE OF os_id ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.sync_orcamento_cliente_equipamento();

-- Total sempre recalculado a partir de subtotal (somado dos itens, ver
-- abaixo) menos o desconto do orcamento — nunca digitado a mao.
CREATE OR REPLACE FUNCTION public.recalcular_orcamento_total()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.total := GREATEST(NEW.subtotal - NEW.desconto, 0);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_orcamento_total ON public.orcamentos;
CREATE TRIGGER trg_orcamento_total
  BEFORE INSERT OR UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_orcamento_total();

-- Historico de status, mesmo padrao ja usado em equipamentos e ordens_servico.
CREATE TABLE public.orcamento_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.status_orcamento,
  titulo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orc_eventos_orc ON public.orcamento_eventos (orcamento_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamento_eventos TO authenticated;
GRANT ALL ON public.orcamento_eventos TO service_role;
ALTER TABLE public.orcamento_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orc_eventos_auth_all" ON public.orcamento_eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_orcamento_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.orcamento_eventos (orcamento_id, usuario_id, status, titulo)
    VALUES (NEW.id, auth.uid(), NEW.status, 'Orçamento criado');
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.orcamento_eventos (orcamento_id, usuario_id, status, titulo)
    VALUES (NEW.id, auth.uid(), NEW.status, 'Status atualizado');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_orcamento_status_log ON public.orcamentos;
CREATE TRIGGER trg_orcamento_status_log
  AFTER INSERT OR UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.log_orcamento_status();

-- ============ ORCAMENTO_ITENS: redesenhado (nunca foi usado pela aplicacao) ============
CREATE TYPE public.tipo_item_orcamento AS ENUM ('produto', 'servico');

ALTER TABLE public.orcamento_itens
  DROP COLUMN IF EXISTS item,
  ADD COLUMN IF NOT EXISTS tipo public.tipo_item_orcamento NOT NULL DEFAULT 'servico',
  ADD COLUMN IF NOT EXISTS desconto NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.orcamento_itens RENAME COLUMN preco_unitario TO valor_unitario;

ALTER TABLE public.orcamento_itens
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2)
    GENERATED ALWAYS AS (quantidade * valor_unitario - desconto) STORED;

DROP TRIGGER IF EXISTS trg_orcamento_itens_updated ON public.orcamento_itens;
CREATE TRIGGER trg_orcamento_itens_updated BEFORE UPDATE ON public.orcamento_itens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mantem orcamentos.subtotal como soma dos itens sempre que a lista muda.
CREATE OR REPLACE FUNCTION public.recalcular_subtotal_orcamento()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_orcamento_id UUID := COALESCE(NEW.orcamento_id, OLD.orcamento_id);
BEGIN
  UPDATE public.orcamentos
  SET subtotal = (
    SELECT COALESCE(SUM(subtotal), 0) FROM public.orcamento_itens WHERE orcamento_id = v_orcamento_id
  )
  WHERE id = v_orcamento_id;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_orcamento_itens_recalc ON public.orcamento_itens;
CREATE TRIGGER trg_orcamento_itens_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.orcamento_itens
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_subtotal_orcamento();
