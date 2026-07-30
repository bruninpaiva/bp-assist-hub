# BP Info Core

Quero criar um sistema SaaS moderno chamado **BP Info Gestão**, destinado ao gerenciamento completo de uma empresa de assistência técnica e serviços de informática.

O objetivo desta primeira versão NÃO é implementar todas as funcionalidades, mas criar uma arquitetura sólida, escalável, organizada e profissional que servirá como base para o desenvolvimento futuro.

## Tecnologias

Utilize obrigatoriamente:

- React

- TypeScript

- Vite

- Supabase

- TailwindCSS

- shadcn/ui

- React Router

- TanStack Query

- React Hook Form

- Zod

- Lucide Icons

Utilize as melhores práticas atuais.

---

# Design

Quero um visual premium.

Inspire-se em sistemas como:

- Linear

- Stripe Dashboard

- Notion

- Vercel Dashboard

A interface deve ser extremamente moderna, elegante e limpa.

Não quero aparência de CRUD simples.

Utilize:

- Sidebar recolhível

- Topbar moderna

- Cards elegantes

- Ícones consistentes

- Layout totalmente responsivo

- Dark Mode por padrão

- Cor principal em tons de azul

- Animações suaves

- Skeleton Loading

- Toast Notifications

- Componentes reutilizáveis

---

# Identidade Visual

Utilize como base a identidade visual da empresa BP Info.

Aproveite a logo e os dados presentes no documento de orçamento anexado para criar a identidade visual inicial do sistema, modernizando-a sem perder sua essência.

---

# Objetivo do Sistema

O sistema será utilizado para controlar toda a operação da empresa.

Ele deverá ser preparado para evoluir futuramente com módulos completos.

Nesta primeira versão, quero apenas a estrutura completa.

---

# Criar as seguintes páginas

## Dashboard

Dashboard moderno contendo:

- Cards

- Gráficos de exemplo

- Últimas Ordens de Serviço

- Últimos Orçamentos

- Fluxo financeiro resumido

Utilize dados fictícios apenas para demonstração.

---

## Clientes

Criar estrutura para:

- Lista

- Cadastro

- Edição

- Detalhes

Preparar campos para:

Pessoa Física

Pessoa Jurídica

Telefone

WhatsApp

Email

CPF

CNPJ

Endereço

Observações

---

## Equipamentos

Criar estrutura para cadastro de:

Notebook

Desktop

Servidor

Monitor

Impressora

Switch

Roteador

Nobreak

Outros

Preparar campos para:

Marca

Modelo

Número de Série

Patrimônio

Cliente

Fotos

Defeito informado

Estado físico

Acessórios

Observações

---

## Ordens de Serviço

Criar estrutura preparada para:

Cadastro

Listagem

Detalhes

Timeline

Status

Histórico

Sem implementar regras complexas nesta etapa.

---

## Orçamentos

Criar estrutura para:

Lista

Cadastro

Visualização

Preparar o sistema para futura geração de PDF.

---

## Financeiro

Criar páginas para:

Fluxo de Caixa

Entradas

Saídas

Receitas

Despesas

Relatórios

Somente estrutura.

---

## Estoque

Criar estrutura para:

Produtos

Categorias

Movimentações

Fornecedores

Sem lógica avançada.

---

## Agenda

Criar página de calendário preparada para:

Visitas

Retiradas

Entregas

Compromissos

---

## Configurações

Empresa

Usuários

Permissões

Categorias

Status

Preferências

---

# Banco de Dados

Criar um banco de dados muito bem estruturado utilizando Supabase.

Utilizar:

- UUID

- Foreign Keys

- Índices

- created_at

- updated_at

- Soft Delete quando fizer sentido

Modelar corretamente os relacionamentos.

Evitar redundâncias.

Pensar em escalabilidade.

---

# Segurança

Implementar autenticação utilizando Supabase Auth.

Preparar Row Level Security.

Criar estrutura para perfis:

- Administrador

- Técnico

- Financeiro

- Atendente

---

# Organização do Projeto

Organizar o código em:

components

pages

layouts

hooks

contexts

services

types

utils

lib

Criar componentes reutilizáveis.

Não criar arquivos gigantes.

Seguir arquitetura limpa.

---

# Qualidade

Prefira criar uma excelente base ao invés de tentar implementar centenas de funcionalidades.

Quero um projeto organizado como um software comercial.

O objetivo é evoluir este sistema durante os próximos meses.

---

# Muito importante

Não quero um CRUD genérico.

Quero que o sistema já nasça com aparência de produto comercial.

Toda a estrutura deve ser pensada para futura implementação de:

- Controle completo de assistência técnica

- Histórico de equipamentos

- Controle financeiro

- Fluxo de caixa

- Controle de estoque

- Geração de PDF

- Aprovação online de orçamentos

- Assinatura digital

- Upload de fotos

- QR Code

- Garantias

- Integração com WhatsApp

- Inteligência Artificial para auxiliar diagnósticos

Mesmo que essas funcionalidades ainda não sejam implementadas agora, toda a arquitetura deve ser preparada para recebê-las futuramente.

Crie um sistema bonito, moderno, rápido, organizado, altamente escalável e com experiência de uso comparável a softwares comerciais de alto nível.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bp-assist-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2a20944b-a6a1-4094-aa5b-4236f290ab97).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
