-- ============ EQUIPAMENTOS: nucleo do sistema ============

CREATE TYPE public.status_equipamento AS ENUM (
  'recebido',
  'em_analise',
  'aguardando_orcamento',
  'aguardando_aprovacao',
  'aguardando_peca',
  'em_manutencao',
  'pronto',
  'entregue',
  'cancelado'
);

CREATE TYPE public.categoria_foto AS ENUM ('entrada', 'durante_manutencao', 'final', 'entrega');

ALTER TABLE public.equipamentos
  ADD COLUMN IF NOT EXISTS processador TEXT,
  ADD COLUMN IF NOT EXISTS memoria_ram TEXT,
  ADD COLUMN IF NOT EXISTS armazenamento TEXT,
  ADD COLUMN IF NOT EXISTS sistema_operacional TEXT,
  ADD COLUMN IF NOT EXISTS senha_informada TEXT,
  ADD COLUMN IF NOT EXISTS diagnostico TEXT,
  ADD COLUMN IF NOT EXISTS status public.status_equipamento NOT NULL DEFAULT 'recebido',
  ADD COLUMN IF NOT EXISTS data_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS previsao_entrega TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS garantia_ate DATE;

CREATE INDEX IF NOT EXISTS idx_equip_marca ON public.equipamentos (marca);
CREATE INDEX IF NOT EXISTS idx_equip_modelo ON public.equipamentos (modelo);
CREATE INDEX IF NOT EXISTS idx_equip_status ON public.equipamentos (status);
-- idx_equip_cliente e idx_equip_serie ja existem desde a migration inicial.

-- ============ CHECKLIST DE ENTRADA (configuravel) ============
CREATE TABLE public.checklist_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_itens TO authenticated;
GRANT ALL ON public.checklist_itens TO service_role;
ALTER TABLE public.checklist_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_itens_auth_all" ON public.checklist_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_checklist_itens_updated BEFORE UPDATE ON public.checklist_itens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.checklist_itens (nome, ordem) VALUES
  ('Tela íntegra', 1),
  ('Carcaça', 2),
  ('Teclado', 3),
  ('Touchpad', 4),
  ('Fonte', 5),
  ('Carregador', 6),
  ('Bolsa', 7),
  ('Mochila', 8),
  ('Mouse', 9),
  ('Cabos', 10),
  ('Outros acessórios', 11);

CREATE TABLE public.equipamento_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.checklist_itens(id) ON DELETE SET NULL,
  presente BOOLEAN NOT NULL DEFAULT false,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (equipamento_id, item_id)
);
CREATE INDEX idx_equip_checklist_equip ON public.equipamento_checklist (equipamento_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipamento_checklist TO authenticated;
GRANT ALL ON public.equipamento_checklist TO service_role;
ALTER TABLE public.equipamento_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equip_checklist_auth_all" ON public.equipamento_checklist FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ FOTOS (Supabase Storage) ============
CREATE TABLE public.equipamento_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  categoria public.categoria_foto NOT NULL DEFAULT 'entrada',
  storage_path TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_equip_fotos_equip ON public.equipamento_fotos (equipamento_id, categoria);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipamento_fotos TO authenticated;
GRANT ALL ON public.equipamento_fotos TO service_role;
ALTER TABLE public.equipamento_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equip_fotos_auth_all" ON public.equipamento_fotos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Bucket privado: toda leitura acontece via signed URL (createSignedUrl),
-- nunca por URL publica.
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipamento-fotos', 'equipamento-fotos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "equip_fotos_storage_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'equipamento-fotos');
CREATE POLICY "equip_fotos_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'equipamento-fotos');
CREATE POLICY "equip_fotos_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'equipamento-fotos');

-- ============ HISTORICO / TIMELINE DE STATUS ============
-- Mesmo formato de public.os_eventos, para o mesmo padrao de timeline.
CREATE TABLE public.equipamento_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.status_equipamento,
  titulo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_equip_eventos_equip ON public.equipamento_eventos (equipamento_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipamento_eventos TO authenticated;
GRANT ALL ON public.equipamento_eventos TO service_role;
ALTER TABLE public.equipamento_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equip_eventos_auth_all" ON public.equipamento_eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Loga automaticamente toda mudanca de status (inclusive o cadastro inicial)
-- para alimentar a timeline sem exigir logica extra no frontend.
CREATE OR REPLACE FUNCTION public.log_equipamento_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.equipamento_eventos (equipamento_id, usuario_id, status, titulo)
    VALUES (NEW.id, auth.uid(), NEW.status, 'Equipamento recebido');
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.equipamento_eventos (equipamento_id, usuario_id, status, titulo)
    VALUES (NEW.id, auth.uid(), NEW.status, 'Status atualizado');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_equip_status_log
  AFTER INSERT OR UPDATE ON public.equipamentos
  FOR EACH ROW EXECUTE FUNCTION public.log_equipamento_status();
