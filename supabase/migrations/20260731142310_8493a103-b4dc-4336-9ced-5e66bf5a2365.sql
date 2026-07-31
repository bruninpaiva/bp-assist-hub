-- ============ CLIENTES: campos e indices para o modulo completo ============

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;

DROP INDEX IF EXISTS public.idx_clientes_doc;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_cpf_unico
  ON public.clientes (cpf)
  WHERE cpf IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_cnpj_unico
  ON public.clientes (cnpj)
  WHERE cnpj IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON public.clientes (telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes (email);