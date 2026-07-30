-- ============ CLIENTES: campos e indices para o modulo completo ============

-- Nome fantasia (pessoa juridica) — nao existia na migration inicial.
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;

-- A migration inicial criava um indice composto (cpf, cnpj) pouco util para
-- buscas por uma coluna isolada. Substituido por indices unicos parciais por
-- coluna: servem tanto para busca quanto para impedir duplicidade de
-- documento entre clientes ativos (nao deletados). NULL nao conflita com
-- NULL em indice unico, entao clientes sem documento continuam permitidos.
DROP INDEX IF EXISTS public.idx_clientes_doc;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_cpf_unico
  ON public.clientes (cpf)
  WHERE cpf IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_cnpj_unico
  ON public.clientes (cnpj)
  WHERE cnpj IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON public.clientes (telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes (email);

-- idx_clientes_nome ja existe desde a migration inicial.
