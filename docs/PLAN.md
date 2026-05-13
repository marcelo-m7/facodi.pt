# FACODI Plan

Roadmap vivo do frontend FACODI.

## Objetivos 2026

- Consolidar estabilidade dos fluxos de estudante, curadoria e admin.
- Fortalecer qualidade de dados entre modo `mock` e modo `supabase`.
- Evoluir experiencia de estudo com foco em progresso e descoberta de conteudo.
- Ampliar governanca de acessibilidade e qualidade de release.

## Trimestre Atual

- Documentacao tecnica padronizada em `README.md`, `AGENTS.md` e `docs/`.
- Alinhamento de links de instrucoes para evitar referencias quebradas.
- Fortalecimento do checklist de contribuicao e validacao de PR.

## Proximas Entregas

- Expandir cobertura E2E para cenarios de erro e resiliencia de dados.
- Revisar pontos de criacao de cliente Supabase para convergir em singleton compartilhado.
- Definir baseline de metricas de UX (tempo de carregamento e navegacao principal).
- Estruturar playbook de rollout/rollback para mudancas sensiveis.

## Backlog Estrategico

- Internacionalizacao expandida para novos idiomas alem de PT/EN.
- Melhorias de observabilidade no frontend (erros, eventos, degradacao).
- Refinamento da experiencia mobile em fluxos administrativos.

## Gates de Qualidade

Antes de merge:

1. `pnpm build`
2. `pnpm test:e2e` (quando aplicavel)
3. `pnpm security:check-rls` (quando aplicavel)

## Riscos Principais

- Quebra de contratos entre `Course`, `CurricularUnit` e `Playlist`.
- Divergencia entre regras documentadas e implementacao real.
- Acoplamento de provider em componentes de UI.
