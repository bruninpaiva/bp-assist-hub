-- ============ STORAGE: buckets privados (equipamento-fotos, orcamento-pdfs) ============
-- As duas migrations anteriores (equipamentos_completo e orcamentos_aprovacao_digital)
-- ja foram corrigidas para criar os buckets como privados desde o inicio, mas esta
-- migration existe para cobrir o caso de os buckets terem sido criados (ou nao
-- terem sido criados) por uma aplicacao parcial anterior — o upsert abaixo funciona
-- tanto se o bucket ja existe (flipa para privado) quanto se ainda nao existe (cria).
--
-- A partir de agora, NENHUMA leitura usa URL publica: tudo passa por
-- storageService.createSignedUrl()/createSignedUrls().

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('equipamento-fotos', 'equipamento-fotos', false),
  ('orcamento-pdfs', 'orcamento-pdfs', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Reafirma as policies de storage.objects de forma idempotente (seguro rodar
-- mesmo que as migrations anteriores ja as tenham criado).

DROP POLICY IF EXISTS "equip_fotos_storage_select" ON storage.objects;
CREATE POLICY "equip_fotos_storage_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'equipamento-fotos');
DROP POLICY IF EXISTS "equip_fotos_storage_insert" ON storage.objects;
CREATE POLICY "equip_fotos_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'equipamento-fotos');
DROP POLICY IF EXISTS "equip_fotos_storage_delete" ON storage.objects;
CREATE POLICY "equip_fotos_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'equipamento-fotos');

-- orcamento-pdfs libera SELECT tambem para "anon": a pagina publica de
-- aprovacao (/orcamento/$token) roda sem sessao e precisa gerar a signed URL
-- do PDF pelo lado do cliente. O path do objeto (id do orcamento) so chega
-- ao visitante via obter_orcamento_publico(), que exige o token secreto —
-- este GRANT nao permite listar o bucket, so assinar um path ja conhecido.
DROP POLICY IF EXISTS "orc_pdfs_storage_select" ON storage.objects;
CREATE POLICY "orc_pdfs_storage_select" ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'orcamento-pdfs');
DROP POLICY IF EXISTS "orc_pdfs_storage_insert" ON storage.objects;
CREATE POLICY "orc_pdfs_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'orcamento-pdfs');
DROP POLICY IF EXISTS "orc_pdfs_storage_delete" ON storage.objects;
CREATE POLICY "orc_pdfs_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'orcamento-pdfs');
