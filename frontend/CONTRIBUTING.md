# Contributing to FACODI Frontend

Obrigado por contribuir com a plataforma.

## Fluxo Recomendado

1. Faça fork do repositório.
2. Crie uma branch de trabalho a partir da branch alvo do projeto.
3. Instale dependências e valide build local.
4. Execute validações relevantes para o escopo da mudança.
5. Abra PR com contexto, evidências e impactos.

## Setup Local

```bash
corepack enable
pnpm install
cp .env.local.example .env.local
pnpm dev
```

Validação mínima antes do PR:

```bash
pnpm build
```

Quando houver impacto em navegação, páginas, autenticação ou comportamento visual:

```bash
pnpm test:e2e
```

Quando houver impacto em integração Supabase/políticas:

```bash
pnpm security:check-rls
```

## Regras de Arquitetura

- Use `pnpm` (não `npm`) para manter lockfile consistente.
- Mantenha lógica de fonte de dados em `services/catalogSource.ts`.
- Não colocar detalhes de banco/provedor em componentes de UI.
- Use cliente Supabase único de `services/supabase.ts`.
- Preserve fallback para dados `mock` quando fonte remota falhar.

## Contratos de Dados Obrigatórios

- `Course.id` deve permanecer estável e único.
- `CurricularUnit.courseId` deve apontar para um `Course.id` existente.
- `Playlist.units` deve continuar como `string[]` de ids válidos.
- Preserve ordenação determinística das playlists para evitar regressão visual.

## Ambiente e Segurança

- Nunca commitar `.env` ou `.env.local`.
- Não usar service role key no frontend.
- Em Supabase, usar apenas chaves publicáveis (`VITE_SUPABASE_PUBLISHABLE_KEY`).
- Não consultar `auth.users` no frontend; usar `public.profiles`.

## Pull Request Checklist

Inclua no PR:

- Contexto do problema e escopo.
- Resumo objetivo da solução.
- Evidências de validação (`pnpm build`, E2E e/ou RLS quando aplicável).
- Capturas de tela para alterações visuais relevantes.
- Riscos conhecidos e plano de rollback (quando aplicável).

## Conteúdo e Curadoria

- Envio de conteúdo audiovisual: https://tube.open2.tech
- Contato institucional e parcerias: https://open2.tech/contact
