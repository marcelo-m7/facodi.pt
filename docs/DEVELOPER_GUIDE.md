# Developer Guide

Guia rapido para contribuir no frontend FACODI.

## Stack

- React 19
- TypeScript
- Vite
- Supabase JS
- Playwright (E2E)

## Primeiros Passos

```bash
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

Aplicacao local: http://localhost:3000

## Arquitetura de Dados

Entrada unica de catalogo:

- `services/catalogSource.ts` -> `loadCatalogData()`

Modos:

- `VITE_DATA_SOURCE=mock`
- `VITE_DATA_SOURCE=supabase`

Regra:

- Componentes nao devem conhecer detalhes de provider.
- Mapeamento e normalizacao ficam em `services/`.

## Supabase

Cliente compartilhado:

- `services/supabase.ts`

Regras essenciais:

- Nao usar service role key no frontend.
- Nao acessar `auth.users` no cliente.
- Respeitar RLS para dados por usuario.

## Testes e Validacao

```bash
pnpm build
pnpm test:e2e
pnpm security:check-rls
```

Quando executar:

- `build`: sempre.
- `test:e2e`: alteracoes de fluxo, tela, auth ou navegacao.
- `security:check-rls`: alteracoes de schema, policy ou integracao de dados.

## Estrutura Recomendada

- `components/`: UI e composicao de paginas.
- `services/`: acesso a dados e integracoes.
- `contexts/`: estado global.
- `hooks/`: logica reutilizavel de dominio.
- `data/`: fallback local para modo `mock`.

## Convencoes para PR

- Explique o problema e o impacto funcional.
- Inclua evidencias de validacao.
- Documente riscos e eventual rollback.
- Atualize docs afetados pela mudanca.
