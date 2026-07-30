-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin','tecnico','financeiro','atendente');
CREATE TYPE public.tipo_pessoa AS ENUM ('fisica','juridica');
CREATE TYPE public.tipo_equipamento AS ENUM ('notebook','desktop','servidor','monitor','impressora','switch','roteador','nobreak','outros');
CREATE TYPE public.status_os AS ENUM ('aberta','em_analise','aguardando_aprovacao','aguardando_peca','em_execucao','concluida','entregue','cancelada');
CREATE TYPE public.prioridade AS ENUM ('baixa','media','alta','urgente');
CREATE TYPE public.status_orcamento AS ENUM ('rascunho','enviado','aprovado','recusado','expirado');
CREATE TYPE public.tipo_lancamento AS ENUM ('entrada','saida');
CREATE TYPE public.status_lancamento AS ENUM ('pendente','pago','atrasado','cancelado');
CREATE TYPE public.tipo_movimentacao AS ENUM ('entrada','saida','ajuste');
CREATE TYPE public.tipo_agenda AS ENUM ('visita','retirada','entrega','manutencao','compromisso');

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT,
  telefone TEXT,
  cargo TEXT,
  avatar_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "roles_select_auth" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)), NEW.email);
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN (SELECT count(*) FROM auth.users) <= 1 THEN 'admin'::public.app_role ELSE 'atendente'::public.app_role END);
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ EMPRESA ============
CREATE TABLE public.empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_fantasia TEXT NOT NULL DEFAULT 'BP Info',
  razao_social TEXT,
  cnpj TEXT,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  site TEXT,
  logo_url TEXT,
  endereco TEXT, numero TEXT, bairro TEXT, cidade TEXT, uf TEXT, cep TEXT,
  validade_orcamento_dias INTEGER NOT NULL DEFAULT 15,
  observacoes_padrao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresa TO authenticated;
GRANT ALL ON public.empresa TO service_role;
ALTER TABLE public.empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresa_select_auth" ON public.empresa FOR SELECT TO authenticated USING (true);
CREATE POLICY "empresa_admin_manage" ON public.empresa FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_empresa_updated BEFORE UPDATE ON public.empresa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.empresa (nome_fantasia, cnpj, telefone, whatsapp, email, cidade, uf, observacoes_padrao)
VALUES ('BP Info','27.592.687/0001-58','(16) 98224-5656','(16) 98224-5656','bpinfojard@gmail.com','Ribeirão Preto','SP',
'Este orçamento tem validade de 15 dias. Após este período, favor consulte-nos novamente. Todos os preços informados estão expressos em Reais (R$) e são exclusivos para este orçamento.');

-- ============ CLIENTES ============
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_pessoa public.tipo_pessoa NOT NULL DEFAULT 'fisica',
  nome TEXT NOT NULL,
  razao_social TEXT,
  cpf TEXT, cnpj TEXT, inscricao_estadual TEXT,
  telefone TEXT, whatsapp TEXT, email TEXT,
  cep TEXT, endereco TEXT, numero TEXT, complemento TEXT, bairro TEXT, cidade TEXT, uf TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clientes_nome ON public.clientes (nome);
CREATE INDEX idx_clientes_deleted ON public.clientes (deleted_at);
CREATE INDEX idx_clientes_doc ON public.clientes (cpf, cnpj);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clientes_auth_all" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ EQUIPAMENTOS ============
CREATE TABLE public.equipamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  tipo public.tipo_equipamento NOT NULL DEFAULT 'notebook',
  marca TEXT, modelo TEXT, numero_serie TEXT, patrimonio TEXT,
  defeito_informado TEXT, estado_fisico TEXT, acessorios TEXT, observacoes TEXT,
  fotos TEXT[] NOT NULL DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_equip_cliente ON public.equipamentos (cliente_id);
CREATE INDEX idx_equip_serie ON public.equipamentos (numero_serie);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipamentos TO authenticated;
GRANT ALL ON public.equipamentos TO service_role;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equip_auth_all" ON public.equipamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_equip_updated BEFORE UPDATE ON public.equipamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ORDENS DE SERVICO ============
CREATE SEQUENCE public.os_numero_seq START 1;
CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL DEFAULT nextval('public.os_numero_seq'),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  equipamento_id UUID REFERENCES public.equipamentos(id) ON DELETE SET NULL,
  tecnico_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.status_os NOT NULL DEFAULT 'aberta',
  prioridade public.prioridade NOT NULL DEFAULT 'media',
  titulo TEXT NOT NULL,
  descricao TEXT, diagnostico TEXT, solucao TEXT,
  valor_servico NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_pecas NUMERIC(12,2) NOT NULL DEFAULT 0,
  garantia_dias INTEGER NOT NULL DEFAULT 90,
  data_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_previsao TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  data_entrega TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_os_numero ON public.ordens_servico (numero);
CREATE INDEX idx_os_cliente ON public.ordens_servico (cliente_id);
CREATE INDEX idx_os_status ON public.ordens_servico (status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordens_servico TO authenticated;
GRANT ALL ON public.ordens_servico TO service_role;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "os_auth_all" ON public.ordens_servico FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_os_updated BEFORE UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.os_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.status_os,
  titulo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_os_eventos_os ON public.os_eventos (os_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.os_eventos TO authenticated;
GRANT ALL ON public.os_eventos TO service_role;
ALTER TABLE public.os_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "os_eventos_auth_all" ON public.os_eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ ORCAMENTOS ============
CREATE SEQUENCE public.orcamento_numero_seq START 68;
CREATE TABLE public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL DEFAULT nextval('public.orcamento_numero_seq'),
  ano INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  os_id UUID REFERENCES public.ordens_servico(id) ON DELETE SET NULL,
  status public.status_orcamento NOT NULL DEFAULT 'rascunho',
  titulo TEXT,
  validade_dias INTEGER NOT NULL DEFAULT 15,
  prazo_entrega TEXT,
  condicoes_pagamento TEXT,
  observacoes TEXT,
  desconto NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_emissao TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_aprovacao TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orc_cliente ON public.orcamentos (cliente_id);
CREATE INDEX idx_orc_status ON public.orcamentos (status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamentos TO authenticated;
GRANT ALL ON public.orcamentos TO service_role;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orc_auth_all" ON public.orcamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_orc_updated BEFORE UPDATE ON public.orcamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  item TEXT,
  descricao TEXT NOT NULL,
  quantidade NUMERIC(12,2) NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orc_itens ON public.orcamento_itens (orcamento_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamento_itens TO authenticated;
GRANT ALL ON public.orcamento_itens TO service_role;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orc_itens_auth_all" ON public.orcamento_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ FINANCEIRO ============
CREATE TABLE public.categorias_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo public.tipo_lancamento NOT NULL,
  cor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias_financeiras TO authenticated;
GRANT ALL ON public.categorias_financeiras TO service_role;
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catfin_auth_all" ON public.categorias_financeiras FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.tipo_lancamento NOT NULL,
  status public.status_lancamento NOT NULL DEFAULT 'pendente',
  categoria_id UUID REFERENCES public.categorias_financeiras(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  os_id UUID REFERENCES public.ordens_servico(id) ON DELETE SET NULL,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT,
  data_vencimento DATE,
  data_pagamento DATE,
  observacoes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lanc_tipo ON public.lancamentos (tipo, data_vencimento);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos TO authenticated;
GRANT ALL ON public.lancamentos TO service_role;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lanc_auth_all" ON public.lancamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_lanc_updated BEFORE UPDATE ON public.lancamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ESTOQUE ============
CREATE TABLE public.categorias_produto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias_produto TO authenticated;
GRANT ALL ON public.categorias_produto TO service_role;
ALTER TABLE public.categorias_produto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catprod_auth_all" ON public.categorias_produto FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT, telefone TEXT, email TEXT, contato TEXT,
  cidade TEXT, uf TEXT, observacoes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forn_auth_all" ON public.fornecedores FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria_id UUID REFERENCES public.categorias_produto(id) ON DELETE SET NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  preco_custo NUMERIC(12,2) NOT NULL DEFAULT 0,
  preco_venda NUMERIC(12,2) NOT NULL DEFAULT 0,
  estoque_atual NUMERIC(12,2) NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(12,2) NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'un',
  ativo BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_produtos_nome ON public.produtos (nome);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produtos_auth_all" ON public.produtos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_produtos_updated BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  tipo public.tipo_movimentacao NOT NULL,
  quantidade NUMERIC(12,2) NOT NULL,
  custo_unitario NUMERIC(12,2),
  os_id UUID REFERENCES public.ordens_servico(id) ON DELETE SET NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mov_produto ON public.movimentacoes_estoque (produto_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes_estoque TO authenticated;
GRANT ALL ON public.movimentacoes_estoque TO service_role;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mov_auth_all" ON public.movimentacoes_estoque FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ AGENDA ============
CREATE TABLE public.agenda_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.tipo_agenda NOT NULL DEFAULT 'compromisso',
  titulo TEXT NOT NULL,
  descricao TEXT,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  os_id UUID REFERENCES public.ordens_servico(id) ON DELETE SET NULL,
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  local TEXT,
  inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fim TIMESTAMPTZ,
  concluido BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agenda_inicio ON public.agenda_eventos (inicio);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_eventos TO authenticated;
GRANT ALL ON public.agenda_eventos TO service_role;
ALTER TABLE public.agenda_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agenda_auth_all" ON public.agenda_eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_agenda_updated BEFORE UPDATE ON public.agenda_eventos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();