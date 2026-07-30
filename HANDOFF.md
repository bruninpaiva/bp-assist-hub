# Handoff Técnico — BP Info Gestão

> Documento gerado em 30/07/2026 por análise direta do código-fonte, do banco Supabase e do dev server rodando localmente. Todas as afirmações abaixo foram verificadas lendo os arquivos reais do projeto (não é um resumo do prompt original) — onde há incerteza, isso é dito explicitamente.

---

## 1. Arquitetura

### Tecnologias utilizadas

| Camada | Tecnologia | Observação |
|---|---|---|
| Framework | **React 19** + **TypeScript 5.8** | strict mode ativo |
| Build/dev server | **Vite 8** via `@lovable.dev/vite-tanstack-config` | wrapper da Lovable que já injeta TanStack Start, Tailwind, tsconfig-paths, nitro etc. **Não adicione esses plugins manualmente no `vite.config.ts`** (há um comentário no próprio arquivo avisando disso) |
| Roteamento | **TanStack Router / TanStack Start** (SSR) | ⚠️ O prompt original pedia "React Router", mas o que foi de fato implementado é TanStack Router com SSR via TanStack Start — arquitetura diferente (roteamento por arquivo em `src/routes`, não componentes `<Route>`) |
| Estilo | **TailwindCSS v4** (config CSS-first, sem `tailwind.config.js`) | tema inteiro vive em `src/styles.css` |
| Componentes | **shadcn/ui** (estilo "new-york") | ~45 componentes primitivos gerados em `src/components/ui`, baseados em Radix UI |
| Estado de servidor | **TanStack Query v5** | `QueryClient` único, criado em `src/router.tsx` |
| Formulários | **React Hook Form + Zod** | usado hoje **só** na página `/auth` (login/signup) |
| Backend | **Supabase** (`@supabase/supabase-js`) | Postgres + Auth + (RLS). Projeto remoto: `qdypajonnmzxyvxrdmol.supabase.co` |
| Ícones | **lucide-react** | |
| Gráficos | **recharts** | usados só no Dashboard, com dados fictícios |
| Datas | **date-fns** + locale `ptBR` | |
| Notificações | **sonner** (toasts) | |
| Package manager | **Bun** (`bun.lock`, `bunfig.toml`) | ⚠️ o `README.md` ainda instrui `npm i` — está desatualizado/herdado do template genérico da Lovable. Use `bun install` / `bun run dev` |

### Estrutura de pastas

```
src/
  routes/                    # roteamento por arquivo (TanStack Router) — NUNCA criar src/pages
    __root.tsx               # shell raiz: <html>, providers, 404 e error boundary globais
    index.tsx                # "/" → redirect para /dashboard
    auth.tsx                 # "/auth" — login/signup (pública)
    _authenticated/
      route.tsx              # layout protegido (sidebar+topbar) + guarda de auth (beforeLoad)
      dashboard.tsx
      clientes.tsx
      equipamentos.tsx
      ordens.tsx
      orcamentos.tsx
      financeiro.tsx
      estoque.tsx
      agenda.tsx
      configuracoes.tsx
    README.md                 # convenções de roteamento (leia antes de criar rotas novas)
  components/
    ui/                       # primitivos shadcn — não editar à mão, são gerados
    layout/                   # AppSidebar, Topbar, nav-items.ts (config do menu)
    shared/                   # componentes reutilizáveis de página (ver seção 6)
    dashboard/mock-data.ts    # dados fictícios só do Dashboard
  contexts/AuthContext.tsx    # sessão, perfil, roles, isAdmin, signOut
  hooks/use-mobile.tsx        # breakpoint mobile (768px) usado pela sidebar
  integrations/supabase/      # clients Supabase + tipos gerados (ver seção 3)
  services/queries.ts         # TODA a camada de acesso a dados (queryKeys + funções de fetch)
  types/domain.ts             # aliases amigáveis sobre os tipos gerados do banco
  lib/                        # format.ts, labels.ts, utils.ts (cn), + arquivos internos da Lovable
  router.tsx, start.ts, server.ts, styles.css
supabase/
  config.toml                 # só tem o project_id — não há stack local configurada
  migrations/                 # uma única migration (schema inicial completo)
```

### Padrão de componentes

- Componentes de função + hooks, sem classes.
- Páginas (`src/routes/_authenticated/*.tsx`) fazem tudo inline: chamam `useQuery`, montam `<Table>`/`<Card>`/`<Tabs>` do shadcn diretamente. **Não existem componentes de domínio** (ex.: não há `<ClienteRow>`, `<OrdemCard>`) — cada página reimplementa sua própria tabela. Isso é aceitável para uma v1 "somente estrutura", mas vai gerar duplicação assim que o CRUD real for implementado (ver seção 10).
- Formulários usam `react-hook-form` + `zodResolver` + os componentes `Form*` do shadcn (só existe um exemplo real disso hoje: `auth.tsx`).
- Botões de ação que ainda não têm funcionalidade chamam `toast.info("... chega no próximo módulo.")` em vez de abrir modal/navegar — é assim que "somente estrutura" foi implementado em todas as páginas de operação.

### Estado global utilizado

- **Não há Redux/Zustand/Jotai.** Só dois mecanismos:
  1. **TanStack Query** para estado de servidor (cache de todas as consultas Supabase). Um único `QueryClient` é criado em `getRouter()` (`src/router.tsx`) e injetado no contexto do router; fica disponível via `Route.useRouteContext()` e é usado no `RootComponent` (`__root.tsx`).
  2. **`AuthContext`** (`src/contexts/AuthContext.tsx`) via React Context puro: expõe `session`, `user`, `profile`, `roles`, `loading`, `hasRole()`, `isAdmin`, `signOut()`, `refreshProfile()`.
- Estado local de UI é sempre `useState` por componente (busca de clientes, data selecionada na agenda, etc.) — nada é compartilhado entre páginas.
- Não há `staleTime`/`gcTime` global configurado no QueryClient — usa os defaults do TanStack Query.

### Bibliotecas importantes (além das já citadas)

- Todo o conjunto `@radix-ui/react-*` foi instalado porque o shadcn gera cada componente com sua dependência Radix — vários desses componentes (carousel, command/cmdk, drawer/vaul, input-otp, resizable, menubar, navigation-menu, context-menu) **existem no projeto mas não são usados em nenhuma página ainda**. É boilerplate normal do shadcn, não lixo para remover às pressas, mas também não é sinal de funcionalidade implementada.
- `clsx` + `tailwind-merge` → helper `cn()` em `src/lib/utils.ts`, usado em praticamente todo componente.

---

## 2. Supabase

Projeto remoto (Lovable Cloud/Supabase hospedado): `SUPABASE_URL=https://qdypajonnmzxyvxrdmol.supabase.co` (ver `.env`). **Não há stack local do Supabase configurada** — `supabase/config.toml` só declara o `project_id`. Não ficou claro pelo código como as migrations são de fato aplicadas nesse projeto remoto (provavelmente via integração nativa Supabase↔Lovable, já que o `AGENTS.md` menciona a sincronização com a Lovable) — **confirme isso com o Bruno antes de criar novas migrations**, para não haver divergência entre o arquivo SQL local e o banco real.

### Migrations já executadas

Uma única migration: `supabase/migrations/20260730183549_482e0c93-2fb9-4af4-ba4a-77d386dd736a.sql` (366 linhas) — cria **todo** o schema de uma vez (enums, tabelas, índices, RLS, policies, triggers, seed da empresa).

### Enums

`app_role`, `tipo_pessoa`, `tipo_equipamento`, `status_os`, `prioridade`, `status_orcamento`, `tipo_lancamento`, `status_lancamento`, `tipo_movimentacao`, `tipo_agenda` — todos com os valores em português, listados em `src/types/domain.ts` e traduzidos para labels em `src/lib/labels.ts`.

### Tabelas existentes e relacionamentos

| Tabela | Chave estrangeira | Soft delete | Observação |
|---|---|---|---|
| `profiles` | `id → auth.users.id` | não | espelha `auth.users`, criada automaticamente pelo trigger `handle_new_user` |
| `user_roles` | `user_id → auth.users.id` | não | `UNIQUE(user_id, role)` — um usuário pode ter várias roles |
| `empresa` | — | não | linha única (dados da BP Info), populada via `INSERT` no seed da migration |
| `clientes` | — | **sim** | PF/PJ, índices em `nome`, `deleted_at`, `(cpf, cnpj)` |
| `equipamentos` | `cliente_id → clientes.id` | **sim** | campo `fotos TEXT[]` já existe, mas **não há bucket de Storage criado** para upload real ainda |
| `ordens_servico` | `cliente_id`, `equipamento_id → clientes/equipamentos`, `tecnico_id → auth.users.id` | **sim** | numeração via `SEQUENCE os_numero_seq` |
| `os_eventos` | `os_id → ordens_servico.id` (CASCADE) | não | timeline/histórico da OS — **hoje não é populada nem lida por nenhuma página** (ver seção 8) |
| `orcamentos` | `cliente_id`, `os_id` | **sim** | numeração via `SEQUENCE orcamento_numero_seq START 68` (continua a numeração real da empresa, que estava em 67/2023) |
| `orcamento_itens` | `orcamento_id → orcamentos.id` (CASCADE) | não | itens de linha do orçamento |
| `categorias_financeiras` | — | não | |
| `lancamentos` | `categoria_id`, `cliente_id`, `os_id`, `orcamento_id` | **sim** | entradas/saídas do financeiro |
| `categorias_produto` | — | não | |
| `fornecedores` | — | **sim** | |
| `produtos` | `categoria_id`, `fornecedor_id` | **sim** | |
| `movimentacoes_estoque` | `produto_id` (CASCADE), `os_id`, `usuario_id` | não | |
| `agenda_eventos` | `cliente_id`, `os_id`, `responsavel_id → auth.users.id` | **sim** | |

Todas as tabelas têm `id UUID DEFAULT gen_random_uuid()`, `created_at`/`updated_at TIMESTAMPTZ` (exceto tabelas "filhas"/log como `os_eventos`, `orcamento_itens`, `movimentacoes_estoque`, que só têm `created_at`).

### RLS e Policies — ⚠️ ponto mais importante do handoff

RLS está **habilitado em todas as tabelas**. Porém, com exceção de `profiles`, `user_roles` e `empresa`, **toda tabela de negócio usa a mesma policy genérica**:

```sql
CREATE POLICY "<nome>_auth_all" ON public.<tabela> FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

Ou seja: **qualquer usuário autenticado — não importa a role — tem leitura/escrita/exclusão total** em `clientes`, `equipamentos`, `ordens_servico`, `os_eventos`, `orcamentos`, `orcamento_itens`, `categorias_financeiras`, `lancamentos`, `categorias_produto`, `fornecedores`, `produtos`, `movimentacoes_estoque`, `agenda_eventos`.

Os únicos lugares onde a diferenciação de perfil (admin/técnico/financeiro/atendente) é de fato aplicada no banco são:
- `user_roles`: só admin pode gerenciar roles (`roles_admin_manage`, via função `has_role()`)
- `empresa`: só admin pode editar (`empresa_admin_manage`)
- `profiles`: usuário só pode editar o próprio perfil (`profiles_update_own`)

Isso significa que os 4 perfis existem **só como modelo de dados** — a estrutura para RLS por perfil está pronta (a função `has_role(_user_id, _role)` já existe e funciona), mas **as policies de negócio ainda não usam essa função**. Isso bate com o pedido do prompt original ("preparar RLS", "sem lógica avançada"), mas é o principal item de segurança a resolver antes de um uso real com múltiplos perfis.

### Functions

- `update_updated_at_column()` — trigger genérica que atualiza `updated_at = now()`
- `has_role(_user_id uuid, _role app_role) RETURNS boolean` — `SECURITY DEFINER`, já pronta para ser usada em policies novas
- `handle_new_user()` — trigger em `auth.users` (ver seção 3)

Não há Edge Functions (`supabase/functions/` não existe).

### Triggers

`update_updated_at_column` aplicada em: `profiles`, `empresa`, `clientes`, `equipamentos`, `ordens_servico`, `orcamentos`, `lancamentos`, `produtos`, `agenda_eventos`.
`handle_new_user` — `AFTER INSERT ON auth.users`.

### Buckets de Storage

**Nenhum bucket criado.** O campo `equipamentos.fotos` (`TEXT[]`) já está preparado para receber URLs de imagens, mas o upload de fotos (previsto no prompt original) ainda não tem infraestrutura de Storage por trás.

---

## 3. Autenticação

- **Supabase Auth** por e-mail/senha apenas — sem login social/OAuth.
- **Cadastro** (`/auth`, aba "Criar conta"): `supabase.auth.signUp({ email, password, options: { data: { nome } } })`. O trigger `handle_new_user` cria automaticamente uma linha em `profiles` e uma em `user_roles`.
  - **A primeira conta criada em todo o projeto vira `admin` automaticamente** (`WHERE count(*) FROM auth.users <= 1`); todas as seguintes recebem `atendente` por padrão. Não existe hoje nenhuma tela para promover/trocar a role de um usuário — a aba Configurações → Permissões é só informativa (não edita nada).
  - O projeto Supabase tem a proteção de **senha vazada (HaveIBeenPwned)** ativada — senhas comuns como `123456` são rejeitadas com `weak_password` mesmo passando na validação Zod do formulário (que só exige 6+ caracteres). Isso foi confirmado testando diretamente a API hoje.
  - **Confirmação de e-mail é obrigatória** (config do projeto Supabase) — o login só funciona depois que o usuário clica no link enviado por e-mail. Não existe tela de "reenviar confirmação".
- **Login**: `supabase.auth.signInWithPassword`, redireciona para `/dashboard`.
- **Sessão**: `AuthContext` assina `supabase.auth.onAuthStateChange` + `getSession()` inicial; carrega `profile` e `roles` via duas queries paralelas (`loadMeta`). `signOut()` limpa o cache do TanStack Query e chama `supabase.auth.signOut()`.
- **Guarda de rota**: `src/routes/_authenticated/route.tsx` usa `beforeLoad` (`ssr: false`) chamando `supabase.auth.getUser()`; sem usuário → `redirect({ to: "/auth" })`. Isso protege **a navegação para o grupo de rotas inteiro**, mas **não existe nenhum controle de acesso por role dentro das páginas** — um usuário `atendente` navega e vê Configurações/Financeiro normalmente. O único lugar que checa `isAdmin` é a aba "Empresa" em Configurações (deixa os campos `readOnly` para não-admin).
- **Server functions**: existe um par de middlewares prontos para proteger *server functions* do TanStack Start —
  - `auth-attacher.ts` (client): anexa o Bearer token da sessão Supabase em toda chamada de server function.
  - `auth-middleware.ts` (`requireSupabaseAuth`, server): valida o JWT e expõe `{ supabase, userId, claims }` no contexto.
  - **Nenhuma server function existe hoje no projeto** (nenhum `createServerFn` no código) — esse middleware está pronto mas é código morto até que alguém implemente a primeira mutação server-side (ex.: geração de PDF, operação admin).
- `client.server.ts` (cliente com **service role**, bypassa RLS) também existe e também **não é importado em lugar nenhum** — está corretamente isolado (arquivo `.server.ts`, nunca vai pro bundle do browser), mas hoje é só scaffolding.

### Perfis existentes

| Role | Enum | O que a UI diz que ele acessa (aba Permissões, texto estático) | O que o banco realmente restringe |
|---|---|---|---|
| Administrador | `admin` | "Acesso total ao sistema, usuários e configurações" | `user_roles` e `empresa` (via `has_role`) |
| Técnico | `tecnico` | "Ordens de serviço, equipamentos e agenda" | nada — mesmo acesso de qualquer autenticado |
| Financeiro | `financeiro` | "Financeiro, orçamentos e relatórios" | nada — mesmo acesso de qualquer autenticado |
| Atendente | `atendente` | "Atendimento, clientes e abertura de OS" | nada — mesmo acesso de qualquer autenticado |

---

## 4. Rotas

| URL | Arquivo | Proteção | Descrição |
|---|---|---|---|
| `/` | `routes/index.tsx` | pública | redireciona sempre para `/dashboard` |
| `/auth` | `routes/auth.tsx` | pública | login + cadastro (tabs) |
| `/dashboard` | `routes/_authenticated/dashboard.tsx` | autenticado | painel com dados fictícios |
| `/clientes` | `routes/_authenticated/clientes.tsx` | autenticado | listagem real (Supabase) |
| `/equipamentos` | `routes/_authenticated/equipamentos.tsx` | autenticado | listagem real |
| `/ordens` | `routes/_authenticated/ordens.tsx` | autenticado | listagem real |
| `/orcamentos` | `routes/_authenticated/orcamentos.tsx` | autenticado | listagem real |
| `/financeiro` | `routes/_authenticated/financeiro.tsx` | autenticado | listagem real, em abas |
| `/estoque` | `routes/_authenticated/estoque.tsx` | autenticado | listagem real, em abas |
| `/agenda` | `routes/_authenticated/agenda.tsx` | autenticado | calendário + lista real |
| `/configuracoes` | `routes/_authenticated/configuracoes.tsx` | autenticado | dados da empresa, usuários, permissões, status |
| 404 | `notFoundComponent` em `__root.tsx` | — | não é um arquivo de rota separado |

**Não existem rotas de detalhe/edição** (`/clientes/$id`, `/ordens/$id` etc.) — todas as páginas são só listagem. `src/routes/README.md` documenta a convenção de nomes de arquivo para quem for criar rotas novas (`$id` para dinâmica, `{-$cat}` para opcional, `$` para splat) — leia antes de criar rotas.

---

## 5. Páginas — o que é real e o que é só layout

| Página | Dados reais do Supabase? | O que falta |
|---|---|---|
| **Dashboard** | ❌ 100% mock (`components/dashboard/mock-data.ts`) — assim mesmo por decisão do prompt original ("dados fictícios apenas para demonstração") | Trocar por agregações reais quando fizer sentido |
| **Clientes** | ✅ leitura (`clientesService.list`) + busca client-side por nome | Criar/editar/detalhar/excluir — botão "Novo cliente" só mostra um toast |
| **Equipamentos** | ✅ leitura com join em `clientes` | CRUD completo; os cards de contagem por tipo só mostram os 5 primeiros dos 9 tipos (`.slice(0,5)` em `equipamentos.tsx` — Servidor/Switch/Roteador/Nobreak/Outros ficam de fora, provável esquecimento) |
| **Ordens de Serviço** | ✅ leitura com join em `clientes`+`equipamentos` | CRUD completo; os 4 cards de contagem cobrem só 4 dos 8 status possíveis; a seção "timeline (demonstração)" **usa os dados fictícios do Dashboard**, não a tabela `os_eventos` — a timeline real ainda não foi implementada |
| **Orçamentos** | ✅ leitura com join em `clientes` | CRUD, geração de PDF (botão "Exportar PDF" é só toast); a seção de pré-visualização também usa mock do Dashboard |
| **Financeiro** | ✅ leitura (`lancamentos`, 4 abas) | Os 4 StatCards do topo usam números fixos de `fluxoResumo` (mock), **não** são calculados a partir dos `lancamentos` reais listados logo abaixo — inconsistência a corrigir. Aba "Relatórios" é só `EmptyState` |
| **Estoque** | ✅ leitura (produtos/categorias/fornecedores/movimentações, 4 abas) | CRUD completo |
| **Agenda** | ✅ leitura (`agenda_eventos`) | O `Calendar` (seleção de data) não filtra a lista de eventos — é um estado (`date`) que não é usado em lugar nenhum. Criar/editar compromisso |
| **Configurações** | ✅ leitura (`empresa`, `profiles`+`user_roles`) | Aba "Empresa": os campos aparecem editáveis para admin, mas o botão "Salvar dados" é só toast — **não existe mutação de update real**, mesmo a policy de RLS já permitindo. Aba "Permissões" é só um grid estático explicativo — não atribui/revoga roles. Aba "Status" só mostra os badges de `status_os` como exemplo visual, não é configuração de categorias/status de fato |
| **Auth** (`/auth`) | ✅ totalmente funcional | — |

---

## 6. Componentes reutilizáveis

**`src/components/shared/`** (específicos deste projeto, usados pelas páginas):
- `PageHeader` — título + descrição + slot de ações, usado em toda página
- `StatCard` — card de indicador (label, valor, ícone, trend %, hint, skeleton)
- `StatusBadge` — badge colorido por "tone" (`neutral|info|success|warning|danger|primary`) — ⚠️ ver bug na seção 8
- `EmptyState` — placeholder de lista vazia (ícone + título + descrição)
- `TableSkeleton` — linhas de skeleton para tabelas em loading
- `ModuleTabs` — componente de abas por rota (`Link` + tone ativo) — **existe mas não é usado em nenhuma página hoje** (todas as páginas com abas usam `Tabs` do shadcn direto, não `ModuleTabs`)

**`src/components/layout/`**:
- `AppSidebar` — sidebar recolhível (shadcn `Sidebar`), logo + grupos de navegação (`nav-items.ts`) + rodapé
- `Topbar` — busca (input sem função ainda), sino de notificação (decorativo, sem lista real), menu do usuário (avatar, nome, roles, sair)
- `nav-items.ts` — configuração central do menu (4 grupos: Visão geral, Operação, Gestão, Sistema)

**`src/components/ui/`**: ~45 primitivos shadcn/Radix padrão (button, card, table, tabs, dialog, dropdown-menu, form, input, select, sidebar, sonner/toast, calendar, chart, etc.) — não foram customizados além do tema de cores; tratar como biblioteca, não editar diretamente salvo necessidade real de patch.

---

## 7. Funcionalidades prontas (o que de fato funciona hoje)

1. Login e cadastro com Supabase Auth (com confirmação de e-mail e proteção de senha vazada ativas no projeto).
2. Guarda de rota: usuário não autenticado é redirecionado para `/auth`.
3. Sessão persistida (localStorage) com refresh automático de token.
4. Leitura real do banco (com joins) nas páginas: Clientes, Equipamentos, Ordens de Serviço, Orçamentos, Financeiro, Estoque, Agenda, e nas abas Empresa/Usuários de Configurações.
5. Busca client-side por nome na página de Clientes.
6. Loading state (skeleton) e empty state em toda listagem.
7. Logout, com limpeza do cache do TanStack Query.
8. Dashboard visual completo (gráficos, cards, listas) — porém com dados fictícios.
9. Layout responsivo com sidebar recolhível e dark mode fixo (`<html class="dark">` fixado no `__root.tsx` — não há toggle de tema, "dark mode por padrão" foi implementado como "dark mode único/fixo").
10. Identidade visual da BP Info aplicada (logo real extraída do orçamento em PDF, favicon, chip branco no header/sidebar/login — trocado nesta sessão, ver commit `1bf347f`).

---

## 8. Funcionalidades pendentes

Praticamente todo **CRUD de escrita** está pendente — hoje o sistema é 100% somente-leitura fora do login/cadastro:

- Criar/editar/excluir: Clientes, Equipamentos, Ordens de Serviço, Orçamentos, Lançamentos financeiros, Produtos/Categorias/Fornecedores, Compromissos de agenda.
- Páginas de detalhe (`/clientes/$id`, `/ordens/$id`, etc.) — hoje não existem, só listagem.
- Timeline real de OS usando a tabela `os_eventos` (existe no banco, não é usada em lugar nenhum).
- Geração de PDF de orçamento (botão já existe, é só um toast).
- Aprovação online de orçamento, assinatura digital, QR Code, integração WhatsApp, IA para diagnóstico — tudo isso é "visão de futuro" citada no prompt original; nada disso tem qualquer código ainda, nem scaffolding.
- Upload de fotos de equipamento — coluna `fotos` existe, mas não há bucket de Storage nem componente de upload.
- Atribuição de roles a usuários pela UI (Configurações → Permissões é só leitura).
- Edição real dos dados da empresa (Configurações → Empresa tem o formulário, mas o "Salvar" não persiste nada).
- Cálculo real dos indicadores do Financeiro a partir de `lancamentos` (hoje usa mock).
- Filtragem da Agenda pela data selecionada no calendário (estado existe, não é usado).
- Contagem de equipamentos por tipo cobrindo todos os 9 tipos (hoje só mostra 5).
- RLS por perfil (ver seção 2 — hoje qualquer autenticado tem acesso total às tabelas de negócio).
- Busca/paginação server-side (hoje tudo é carregado inteiro e filtrado no client, ok para poucos registros, não escala).

---

## 9. Problemas conhecidos

### 🔴 Bug confirmado — parte do sistema de design "premium" não existe no CSS

Testei isso rodando o dev server e inspecionando o CSS realmente compilado (`http://localhost:8080/src/styles.css`), não só o código-fonte. Várias classes/tokens usados **extensivamente** pelos componentes **não estão definidos em `src/styles.css`** e por isso o Tailwind v4 simplesmente não gera CSS para eles (não dá erro, só não aplica nenhum estilo):

- `text-success`, `bg-success/*`, `text-info`, `bg-info/*`, `text-warning`, `bg-warning/*`, `text-danger`/`bg-destructive` parcialmente ok (destructive existe, os outros três — success/info/warning — **não têm token de cor registrado** em `@theme inline`) → usado em `StatusBadge` (tones `info`/`success`/`warning`/`danger`) em **todas** as páginas com tabelas, e no `StatCard` (cor do trend).
- `text-primary-glow` → usado em badges de tone `primary`, no avatar do Topbar, no menu ativo da sidebar, no valor de saldo do Dashboard — não existe, então some a cor de destaque.
- `.surface-card` → aplicado em praticamente **todo `<Card>` do sistema** (dashboard, todas as listagens) para dar o efeito "premium" — não existe, os cards renderizam com o estilo padrão do shadcn, sem o acabamento diferenciado pedido no prompt.
- `bg-[var(--gradient-glow)]` → usado no glow de fundo do StatCard e da tela de auth — a variável `--gradient-glow` nunca é definida, então o background fica inválido/sem efeito.
- `.animate-fade-up` → aplicado no `<main>` do layout autenticado (`_authenticated/route.tsx`) para a entrada suave das páginas — não existe.

**Efeito prático**: os StatusBadge de status "Aprovado/Em execução/Aguardando/Cancelado" etc. hoje aparecem todos parecidos (sem a cor semântica pretendida), os cards não têm o efeito de superfície elegante, e não há animação de entrada — ou seja, boa parte do "visual premium tipo Linear/Stripe" pedido no prompt **não está de fato renderizando**, mesmo a intenção estando claramente no código. É provável que uma iteração anterior no Lovable tenha criado esses estilos e uma iteração posterior tenha sobrescrito/perdido o arquivo de tema. **Este é provavelmente o primeiro ajuste visual que vale a pena pedir para o próximo desenvolvedor fazer.**

### Outras inconsistências

- **Financeiro**: StatCards do topo não batem com a lista de lançamentos real (um usa mock, o outro usa dado real).
- **Ordens/Orçamentos**: seções de "demonstração" reaproveitam os mocks do Dashboard misturados com dados reais na mesma página — pode confundir quem for validar a página com o cliente.
- **Equipamentos**: cards de contagem por tipo cobrem só 5 dos 9 tipos de equipamento.
- **Agenda**: seleção de data no calendário não tem efeito algum na lista.
- README.md manda usar `npm i`, mas o projeto usa `bun` (`bun.lock` presente, sem `package-lock.json`).
- Lint (`bun run lint`) falha em **quase todo o repositório** por causa de terminação de linha CRLF vs. a config do Prettier (`prettier/prettier: Delete '␍'`) — isso é anterior a qualquer mudança feita hoje, não foi introduzido agora; mas hoje o comando `lint` não serve como sinal confiável de qualidade porque o ruído de CRLF esconde erros reais. Vale rodar `git config core.autocrlf false` + normalizar os arquivos, ou ajustar o Prettier/ESLint para aceitar CRLF, antes de usar lint como gate de CI.
- Não há testes automatizados no projeto (nenhum arquivo `*.test.*`/`*.spec.*`, nenhuma dependência de test runner no `package.json`).

### Limitações estruturais

- Sem controle de acesso por role em nível de UI/rota (qualquer autenticado vê todas as páginas e, no banco, tem acesso total às tabelas de negócio — ver seção 2).
- Sem paginação/infinite scroll — toda lista busca a tabela inteira.
- Sem tratamento de erro de query visível ao usuário (`useQuery` não trata `isError` em nenhuma página — se uma query falhar, a página simplesmente mostra o estado vazio, o que pode enganar o usuário achando que "não há dados" quando na verdade houve um erro).
- Server functions (TanStack Start) e o cliente admin (`service_role`) estão prontos mas sem nenhum uso real — primeira vez que alguém precisar de uma mutação privilegiada (ex.: gerar PDF, mandar e-mail), esse é o caminho a seguir.

---

## 10. Próximos passos (por prioridade)

1. **Corrigir o design system quebrado** (seção 9) — adicionar em `src/styles.css` os tokens `--success`, `--info`, `--warning`, `--gradient-glow`, a classe `.surface-card` e a animação `fade-up`. É rápido e destrava visualmente todo o resto do trabalho.
2. **Decidir e implementar o modelo de permissões real** — hoje a diferença entre perfis não existe no banco (RLS `USING (true)` em quase tudo). Definir quais tabelas cada role pode ver/editar e reescrever as policies usando `has_role()` (a função já existe, só falta usá-la).
3. **CRUD de Clientes** (cadastro/edição/detalhe) — é a base de que Equipamentos, OS, Orçamentos e Agenda dependem (todos referenciam `cliente_id`). Faz sentido ser o primeiro módulo de escrita.
4. **CRUD de Equipamentos**, depois **Ordens de Serviço** (incluindo popular `os_eventos` para a timeline real), depois **Orçamentos** (incluindo geração de PDF — o modelo visual do orçamento oficial da empresa já está nos dados do seed/migration).
5. **Mutação real na aba Empresa** (Configurações) e **atribuição de roles** (Permissões) — já tem RLS pronta, só falta a chamada `supabase.from(...).update()`/`.insert()`.
6. Financeiro (lançamentos reais) e Estoque (produtos/movimentações reais).
7. Bucket de Storage + upload de fotos de equipamento.
8. Extrair componentes de domínio reutilizáveis (`<ClienteTable>`, formulários compartilhados) à medida que o CRUD cresce, para não duplicar a lógica de tabela em cada página.
9. Resolver o problema de CRLF/lint para que `bun run lint` volte a ser um sinal útil.
10. Itens de "visão de futuro" do prompt original (assinatura digital, QR Code, WhatsApp, IA) — não priorizar antes do CRUD básico e da segurança por perfil estarem resolvidos.

---

## 11. Estrutura do banco — como foi pensado

- **UUID em tudo** (`gen_random_uuid()`), nunca serial/int como PK.
- **Enums Postgres** para todo campo de domínio fechado (status, tipo, prioridade) em vez de `TEXT` livre — evita valores inconsistentes e documenta os estados possíveis direto no schema.
- **Soft delete** (`deleted_at TIMESTAMPTZ`) nas entidades "principais" que um usuário pode querer "excluir" mas recuperar depois: `clientes`, `equipamentos`, `ordens_servico`, `orcamentos`, `fornecedores`, `produtos`, `agenda_eventos`. Tabelas "filhas"/histórico (`os_eventos`, `orcamento_itens`, `movimentacoes_estoque`) não têm — fazem parte do registro permanente do pai.
- **Numeração sequencial de negócio** separada do UUID: `os_numero_seq` e `orcamento_numero_seq` geram os números "#0042" e "67/2023" que o cliente final vê, mantendo a numeração real da empresa (o orçamento começa em 68 porque o último orçamento em papel era o 67/2023).
- **Relacionamentos com `ON DELETE SET NULL`** na maioria das FKs de referência cruzada (ex.: `equipamentos.cliente_id`, `lancamentos.os_id`) — apagar o "pai" não derruba o histórico, só desvincula. Já `orcamento_itens` e `os_eventos` usam `ON DELETE CASCADE` porque não fazem sentido sem o pai.
- **`empresa`** é modelada como tabela (não hardcoded no frontend) pensando em multi-empresa/white-label futuro, mesmo que hoje só exista uma linha.
- **Trigger `handle_new_user`** automatiza o onboarding (perfil + role) para que o cadastro em `auth.users` nunca fique "órfão" sem `profiles`/`user_roles`.
- Índices foram criados nos campos usados para busca/filtro (nome, status, datas de vencimento, `deleted_at`) e não em todo campo — dimensionado para uma tabela de porte pequeno/médio (assistência técnica local), não para escala massiva.

---

## 12. Organização do código — onde cada tipo de arquivo deve ficar

| Tipo de arquivo | Onde colocar | Exemplo |
|---|---|---|
| Nova rota/página | `src/routes/_authenticated/<nome>.tsx` (ou `src/routes/<nome>.tsx` se for pública) | seguir `src/routes/README.md` |
| Componente usado só por uma página | dentro de uma subpasta ao lado da página, ou inline no próprio arquivo de rota se for pequeno | — |
| Componente reutilizável entre páginas | `src/components/shared/` | `PageHeader`, `StatCard` |
| Componente de layout global (sidebar, topbar) | `src/components/layout/` | `AppSidebar` |
| Primitivo de UI genérico (não teria domínio nenhum) | `src/components/ui/` — normalmente via `npx shadcn add <componente>`, não escrito à mão | `dialog.tsx` |
| Função de acesso ao Supabase | `src/services/queries.ts` (adicionar ao objeto de serviço correspondente + `queryKeys`) | `clientesService`, `ordensService` |
| Tipo de domínio derivado do banco | `src/types/domain.ts` | `Cliente`, `OSComRelacoes` |
| Mapeamento enum → label/cor | `src/lib/labels.ts` | `statusOSLabels` |
| Formatação (moeda, data, texto) | `src/lib/format.ts` | `brl()`, `dataCurta()` |
| Lógica de auth compartilhada entre componentes | `src/contexts/AuthContext.tsx` | `useAuth()` |
| Hook genérico sem domínio | `src/hooks/` | `useIsMobile` |
| Nova migration | `supabase/migrations/<timestamp>_<descrição>.sql` | seguir o padrão de nomeação já usado |
| Cliente Supabase | **nunca criar um novo** — reusar `src/integrations/supabase/client.ts` (browser) ou `client.server.ts` (server, service role) | — |

---

## 13. Convenções do projeto

- **Idioma**: nomes de tabela/coluna/enum e textos de UI em **português** (`clientes`, `status_os`, "Aguardando aprovação"). Nomes de tipos TypeScript também em português quando espelham o domínio (`Cliente`, `Orcamento`), mas identificadores de código (funções, variáveis técnicas) em inglês.
- **Path alias**: sempre importar com `@/...` (ex.: `@/components/ui/button`), nunca caminho relativo longo (`../../../lib/utils`) — configurado em `tsconfig.json` e `vite-tsconfig-paths`.
- **Toda tabela de listagem** segue o mesmo padrão: `useQuery` com `queryKeys.<entidade>` → `isLoading` → `<TableSkeleton />` → lista vazia → `<EmptyState />` → `<Table>` do shadcn.
- **Toda página** começa com `<PageHeader title="..." description="..." actions={...} />`.
- **Badges de status/tipo** sempre via `<StatusBadge label=... tone=... />`, nunca `<Badge>` cru com classe manual.
- **Formatação de valores**: sempre via `brl()`/`numero()`/`dataCurta()`/`dataHora()` de `src/lib/format.ts` — nunca `toLocaleString` inline.
- **Ações ainda não implementadas**: usar `toast.info("<recurso> chega no próximo módulo.")` em vez de deixar o botão sem `onClick` ou implementar pela metade — é o padrão adotado em todas as páginas atuais para deixar claro visualmente o que é escopo futuro.
- **RLS obrigatório** em toda tabela nova (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + pelo menos uma policy) — nenhuma tabela do schema atual está sem RLS.
- **Nunca editar à mão**: `src/routeTree.gen.ts` (gerado pelo plugin do TanStack Router), `src/integrations/supabase/types.ts` (gerado a partir do schema do banco), `src/components/ui/*` (gerado pelo shadcn CLI).
- **Server-only code**: qualquer arquivo que use a service role key deve terminar em `.server.ts` (garante que o bundler não o inclua no bundle do browser) — ver comentário em `client.server.ts`.

---

## 14. TODOs encontrados no código

Busca por `TODO|FIXME|XXX|HACK` em todo `src/`: **nenhum resultado.** Não há marcações explícitas de pendência no código — todas as lacunas listadas nas seções 8 e 9 foram identificadas por inspeção funcional (comparando o que cada página faz com o que o schema/prompt original previa), não por comentários deixados no código.

---

## 15. Resumo final

**O que é o projeto**: um SaaS de gestão para uma assistência técnica de informática (BP Info, Ribeirão Preto/SP), construído no Lovable com React 19 + TanStack Start (SSR) + TypeScript + TailwindCSS v4 + shadcn/ui + Supabase. A v1 foi propositalmente escopada como "estrutura completa, sem CRUD de verdade" — isso está refletido fielmente no estado atual: **todo o sistema hoje é somente leitura** (fora login/cadastro), com um schema de banco maduro e bem modelado esperando as telas de escrita.

**Como rodar localmente**: `bun install` seguido de `bun run dev` (porta 8080). Variáveis do Supabase já estão no `.env` (projeto remoto compartilhado, não precisa `supabase start`). Login exige e-mail confirmado (a confirmação é obrigatória no projeto Supabase).

**Os 3 fatos mais importantes para quem for continuar:**

1. **Todas as 9 páginas de operação existem, têm leitura real do Supabase funcionando (com joins), loading/empty state consistentes — mas zero criação/edição/exclusão.** Os botões "Novo X" são só `toast.info`. Isso é o maior bloco de trabalho pendente, e Clientes é o ponto de partida natural porque tudo depende de `cliente_id`.
2. **RLS está ligado em tudo, mas não diferencia perfil nenhum** (`USING (true)` genérico) — os 4 perfis (admin/técnico/financeiro/atendente) existem no banco e a função `has_role()` já está pronta, mas nenhuma policy de negócio a usa ainda. Resolver isso antes de colocar usuários reais de perfis diferentes no sistema.
3. **Parte do sistema visual "premium" pedido no prompt não está de fato aplicada** — confirmei rodando o CSS compilado que classes como `.surface-card`, `text-success/info/warning`, `text-primary-glow`, `.animate-fade-up` e a variável `--gradient-glow` são usadas por dezenas de componentes mas nunca foram definidas em `src/styles.css`. É um ajuste rápido (adicionar os tokens faltantes no tema) com grande impacto visual — provavelmente a primeira coisa a pedir para o próximo desenvolvedor arrumar.

A identidade visual (logo real da BP Info extraída do orçamento em PDF, favicon) foi corrigida nesta sessão (commit `1bf347f`) — antes disso o Lovable tinha gerado uma logo de IA genérica que não era a da empresa.
