---
applyTo: '**/__inactive__/src/codoo/frontend/**'
description: "INATIVO — src/codoo/frontend/ foi removido. Manter para referência histórica."
---

> **NOTA:** Este arquivo de instruções está inativo. O diretório `src/codoo/frontend/` foi removido do projeto.
> Se um frontend React/Vite for readicionado no futuro, restaurar e atualizar os paths abaixo.

## Frontend Workflow (Codoo)

Scope: only frontend files under `src/codoo/frontend/`.

### Mandatory conventions
- Keep API calls centralized in `src/services/` (do not call backend directly from deep UI components).
- Reuse existing chat types from `src/types/chat.ts`.
- Preserve the current Vite dev proxy expectation (`/api` -> backend) and avoid hardcoding backend host in UI code.
- Keep components focused: rendering logic in components, transport logic in services.

### Implementation checklist
1. Keep changes incremental and localized.
2. Match the current CSS and component structure before introducing new patterns.
3. Run `npm run build` for any meaningful UI change.
4. If behavior changes, update frontend docs when needed.

### Quality gates
- No TypeScript errors introduced.
- No obvious regressions in message flow (send, receive, render).
- Keep mobile responsiveness intact.

References:
- [AGENTS.md](../../AGENTS.md)
- [docs/guides/ARCHITECTURE.md](../../docs/guides/ARCHITECTURE.md)
