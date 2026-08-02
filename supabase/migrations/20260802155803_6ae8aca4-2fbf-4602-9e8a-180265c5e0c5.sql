-- Eventos: somente leitura para autenticados (escrita continua via triggers SECURITY DEFINER)
DROP POLICY IF EXISTS os_eventos_auth_all ON public.os_eventos;
DROP POLICY IF EXISTS equip_eventos_auth_all ON public.equipamento_eventos;
DROP POLICY IF EXISTS orc_eventos_auth_all ON public.orcamento_eventos;

CREATE POLICY os_eventos_auth_select ON public.os_eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY equip_eventos_auth_select ON public.equipamento_eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY orc_eventos_auth_select ON public.orcamento_eventos FOR SELECT TO authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.os_eventos FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.equipamento_eventos FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.orcamento_eventos FROM authenticated, anon;
GRANT SELECT ON public.os_eventos TO authenticated;
GRANT SELECT ON public.equipamento_eventos TO authenticated;
GRANT SELECT ON public.orcamento_eventos TO authenticated;
GRANT ALL ON public.os_eventos TO service_role;
GRANT ALL ON public.equipamento_eventos TO service_role;
GRANT ALL ON public.orcamento_eventos TO service_role;

-- Storage: bucket de PDFs somente para autenticados
DROP POLICY IF EXISTS orc_pdfs_storage_select ON storage.objects;
CREATE POLICY orc_pdfs_storage_select ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'orcamento-pdfs');

-- search_path fixo
CREATE OR REPLACE FUNCTION public.recalcular_orcamento_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.total := GREATEST(NEW.subtotal - NEW.desconto, 0);
  RETURN NEW;
END; $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_ordens_servico_tecnico_responsavel
  ON public.ordens_servico (tecnico_responsavel);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orcamentos_numero_ano
  ON public.orcamentos (numero, ano);