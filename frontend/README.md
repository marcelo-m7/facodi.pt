# FACODI Frontend

Single Page Application em React + TypeScript + Vite para navegação de currículos abertos, trilhas de aprendizagem e experiência de estudo com autenticação e progresso.

Projeto mantido por Open2 Technology: https://open2.tech

## Visão Geral

- Stack: React 19 + TypeScript + Vite.
- Frontend orientado a dados com fallback resiliente (`mock` quando necessário).
- Catálogo acadêmico com cursos, unidades curriculares e playlists.
- Fluxos de usuário com autenticação, perfil, favoritos, progresso e histórico.
- Áreas dedicadas para curadoria, pipeline editorial e administração.
- Páginas institucionais e blog com conteúdo em Markdown.
- Testes E2E com Playwright.

## Modos de Dados

A aplicação usa `VITE_DATA_SOURCE` com dois modos:

- `mock`: dados locais em `data/*.ts`.
- `supabase`: leitura do catálogo no schema `public`.

No modo supabase, o catálogo é lido principalmente de:

- `public.courses`
- `public.units`
- `public.playlists`
- `public.unit_enrichments`
- `public.learning_outcomes`
- `public.resources`

Regra arquitetural: `services/catalogSource.ts` é o único entrypoint de catálogo (`loadCatalogData()`) para manter contrato estável entre fontes.

## Requisitos

- Node.js 20+
- Corepack habilitado
- pnpm 10.17.1 (fixado em `packageManager`)

## Setup Rápido

```bash
corepack enable
pnpm install
cp .env.local.example .env.local
pnpm dev
```

## Scripts

- `pnpm dev`: inicia ambiente local com Vite.
- `pnpm build`: gera build de produção.
- `pnpm preview`: sobe preview local da build.
- `pnpm test:e2e`: executa testes E2E (Playwright).
- `pnpm security:check-rls`: valida políticas RLS esperadas no Supabase.

Em máquinas novas para E2E:

```bash
pnpm exec playwright install
```

## Variáveis de Ambiente

Arquivo base: `.env.local.example`

- `VITE_DATA_SOURCE=mock|supabase`
- `VITE_SUPABASE_URL` (obrigatório no modo supabase)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (obrigatório no modo supabase)
- `VITE_SITE_URL` (opcional)
- `USER_EMAIL` e `USER_PASSWORD` (opcionais para fluxos E2E autenticados)

Segurança:

- Não commitar `.env` ou `.env.local`.
- Nunca usar service role key no frontend.
- Nunca consultar `auth.users` diretamente no frontend; usar `public.profiles`.

## Estrutura da Pasta

- `App.tsx`: shell da aplicação, roteamento e bootstrap.
- `components/`: páginas e blocos de UI (home, catálogo, auth, usuário, admin, curadoria, pipeline, estudante).
- `contexts/`: estado global de autenticação e curadoria.
- `hooks/`: hooks de progresso, dashboard e cursos do aluno.
- `services/`: integração com Supabase e fontes de dados.
- `data/`: dados locais para modo `mock`.
- `content/`: conteúdo institucional/blog.
- `tests/e2e/`: cenários end-to-end.
- `scripts/`: utilitários de segurança e suporte operacional.

## Contratos Críticos

- `Course.id` deve permanecer estável e único.
- `CurricularUnit.courseId` deve referenciar um `Course.id` válido.
- `Playlist.units` deve permanecer `string[]` com ids válidos de unidade.
- Ordenação de playlists deve ser determinística para evitar regressão visual.

## Fluxos de Contribuição

- Leia `CONTRIBUTING.md` antes de abrir PR.
- Ao alterar integração Supabase, preserve o cliente único em `services/supabase.ts`.
- Evite lógica de provedor em componentes; mantenha no serviço.

## Links Úteis

- Guia de contribuição: `CONTRIBUTING.md`
- Envio de conteúdo: https://tube.open2.tech
- Contato institucional: https://open2.tech/contact

## Licença

MIT

