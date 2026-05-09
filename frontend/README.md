# FACODI Frontend

Single Page Application em React + TypeScript + Vite para navegação de currículos abertos, unidades curriculares e trilhas com playlists.

Projeto mantido por Open2 Technology: https://open2.tech

## Visão Geral

- Frontend orientado a dados com fallback resiliente.
- Catálogo acadêmico com cursos, unidades e playlists.
- Páginas institucionais renderizadas em Markdown.
- Modo claro/escuro, navegação mobile e acessibilidade por teclado.
- Testes E2E com Playwright.

## Fontes de Dados

A aplicação usa `VITE_DATA_SOURCE` com dois modos:

- `mock`: dados locais em `data/*.ts`.
- `supabase`: leitura do catálogo no schema `public`.

No modo supabase, o catálogo é lido principalmente de:

- public.courses
- public.units
- public.playlists
- public.unit_enrichments
- public.learning_outcomes
- public.resources

## Requisitos

- Node.js 20+
- Corepack habilitado
- pnpm 10.17.1 (definido em packageManager)

## Desenvolvimento Local

1. Instalação:

```bash
corepack enable
pnpm install
```

2. Ambiente local:

```bash
cp .env.local.example .env.local
```

3. Executar:

```bash
pnpm dev
```

4. Build de produção:

```bash
pnpm build
pnpm preview
```

## Variáveis de Ambiente

- `VITE_DATA_SOURCE=mock|supabase`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (modo supabase)

Segurança:

- Não commitar .env ou .env.local.
- Nunca usar service role key no frontend.

## Testes

Instalação inicial do Playwright:

```bash
pnpm exec playwright install
```

Execução E2E:

```bash
pnpm test:e2e
```

## Estrutura Relevante

- App.tsx: shell, roteamento e bootstrap do catálogo.
- services/catalogSource.ts: gateway único de dados (mock/supabase).
- services/contentSource.ts: páginas institucionais.
- components/: páginas e blocos de UI.
- scripts/public_catalog_enrichment.sql: baseline de schema/enriquecimento para public.

## Contribuição

- Guia: CONTRIBUTING.md
- Envio de conteúdo: https://tube.open2.tech
- Contato institucional: https://open2.tech/contact

## Licença

MIT.

