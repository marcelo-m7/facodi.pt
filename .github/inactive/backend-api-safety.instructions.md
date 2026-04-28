---
applyTo: '**/__inactive__/src/codoo/backend/**'
description: "INATIVO — src/codoo/backend/ foi removido. Manter para referência histórica."
---

> **NOTA:** Este arquivo de instruções está inativo. O diretório `src/codoo/backend/` foi removido do projeto.
> Se um backend FastAPI for readicionado no futuro, restaurar e atualizar os paths abaixo.

## Backend API Safety (Codoo)

Scope: backend Python under `src/codoo/backend/`.

### SaaS-safe contract
- Prefer API-first execution paths for Odoo SaaS.
- Do not assume custom Python addon deployment is available in SaaS.
- Keep integrations focused on native Odoo models and JSON-RPC/XML-RPC calls.

### Endpoint rules
- Validate request payloads with explicit Pydantic models.
- Return structured errors with actionable messages.
- Keep side effects explicit and traceable.
- Add guardrails for missing environment variables and restricted mode behavior.

### Reliability and evidence
- For orchestrated operations, return per-step results (success/failure + reason).
- Keep logs/evidence friendly for `docs/logs/` style reporting.
- Do not hide upstream Odoo failures; normalize but preserve root-cause details.

### Security
- Never hardcode secrets.
- Never print credentials in logs.
- Preserve least-privilege behavior for Odoo operations.

References:
- [AGENTS.md](../../AGENTS.md)
- [docs/guides/CODOO.md](../../docs/guides/CODOO.md)
- [docs/guides/SECURITY.md](../../docs/guides/SECURITY.md)
