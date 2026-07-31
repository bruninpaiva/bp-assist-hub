-- ============ ORDENS DE SERVICO: coracao do sistema ============

-- Enum proprio da OS — os valores nao coincidem com status_os (que ja
-- existia com um conjunto diferente); manter os dois separados evita
-- quebrar o enum antigo usado como referencia historica.
CREATE TYPE public.status_ordem_servico AS ENUM (
  'recebido',
  'em_analise',
  'aguardando_orcamento',
  'aguardando_aprovacao',
  'aguardando_peca',
  'em_manutencao',
  'teste',
  'pronto',
  'entregue',
  'cancelado'
);

-- Tabela ja existia (migration inicial) com um recorte de colunas menor.
-- Ajusta o schema para o modelo completo pedido nesta sprint. A tabela
-- esta vazia em producao, entao os renames/ALTER TYPE abaixo sao seguros.
ALTER TABLE public.ordens_servico
  ALTER COLUMN cliente_id SET NOT NULL,
  ALTER COLUMN equipamento_id SET NOT NULL,
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.ordens_servico
  DROP CONSTRAINT IF EXISTS ordens_servico_cliente_id_fkey,
  DROP CONSTRAINT IF EXISTS ordens_servico_equipamento_id_fkey;

ALTER TABLE public.ordens_servico
  ADD CONSTRAINT ordens_servico_cliente_id_fkey
    FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE RESTRICT,
  ADD CONSTRAINT ordens_servico_equipamento_id_fkey
    FOREIGN KEY (equipamento_id) REFERENCES public.equipamentos(id) ON DELETE RESTRICT;

ALTER TABLE public.ordens_servico
  ALTER COLUMN status TYPE public.status_ordem_servico USING 'recebido'::public.status_ordem_servico,
  ALTER COLUMN status SET DEFAULT 'recebido';

ALTER TABLE public.ordens_servico RENAME COLUMN descricao TO problema_relatado;
ALTER TABLE public.ordens_servico RENAME COLUMN valor_servico TO valor_mao_obra;
ALTER TABLE public.ordens_servico RENAME COLUMN tecnico_id TO tecnico_responsavel;
ALTER TABLE public.ordens_servico RENAME COLUMN data_previsao TO previsao_entrega;

ALTER TABLE public.ordens_servico
  ALTER COLUMN problema_relatado SET NOT NULL,
  DROP COLUMN IF EXISTS titulo,
  DROP COLUMN IF EXISTS valor_pecas,
  ADD COLUMN IF NOT EXISTS observacoes TEXT,
  ADD COLUMN IF NOT EXISTS desconto NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ano INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now());

-- numero_os e sempre derivado de numero+ano (ambos ja preenchidos
-- automaticamente) — nunca digitado, por isso e uma generated column.
ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS numero_os TEXT
    GENERATED ALWAYS AS ('OS-' || ano || '-' || lpad(numero::text, 6, '0')) STORED;

CREATE INDEX IF NOT EXISTS idx_os_numero_os ON public.ordens_servico (numero_os);
CREATE INDEX IF NOT EXISTS idx_os_equipamento ON public.ordens_servico (equipamento_id);
CREATE INDEX IF NOT EXISTS idx_os_data_entrada ON public.ordens_servico (data_entrada);
-- idx_os_cliente, idx_os_status e idx_os_numero (unico, sobre a coluna
-- numero) ja existiam desde a migration inicial.

-- os_eventos.status referencia o mesmo enum da OS.
ALTER TABLE public.os_eventos
  ALTER COLUMN status TYPE public.status_ordem_servico USING NULL::public.status_ordem_servico;

CREATE OR REPLACE FUNCTION public.log_os_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.os_eventos (os_id, usuario_id, status, titulo)
    VALUES (NEW.id, auth.uid(), NEW.status, 'Ordem de serviço aberta');
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.os_eventos (os_id, usuario_id, status, titulo)
    VALUES (NEW.id, auth.uid(), NEW.status, 'Status atualizado');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_os_status_log ON public.ordens_servico;
CREATE TRIGGER trg_os_status_log
  AFTER INSERT OR UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.log_os_status();
