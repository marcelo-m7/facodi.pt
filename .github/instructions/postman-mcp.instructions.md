---
description: "Use when creating or managing Postman collections, environments, specs, or mocks with Postman MCP tools. Covers Odoo XML-RPC API documentation, gate validation collections, and workspace/collection naming conventions for this project."
---

# Postman MCP — Codoo/Odoo Guidelines

## When to Use Postman MCP

- Documenting or testing Odoo XML-RPC API operations
- Creating collections to validate Codoo execution gates (Stage 4: API_TEST)
- Generating Postman environments from `.env` variables
- Producing API evidence artifacts for feature delivery reports

## Tool Workflow (ordered)

1. **`getWorkspaces`** — discover existing Postman workspaces; prefer the Corvanis workspace
2. **`createEnvironment`** (once per target) — create `Codoo – <instance>` env with the variables below
3. **`createCollection`** — create or find the feature/task collection
4. **`createCollectionRequest`** — add requests for each Odoo operation
5. **`createCollectionResponse`** — add example responses for documentation
6. **`createSpec` / `createSpecFile`** — when an OpenAPI spec is needed for the API surface

## Odoo XML-RPC Postman Environment

When creating an environment via `createEnvironment`, include these variables:

| Variable | Value Source | Sensitivity |
|---|---|---|
| `ODOO_HOST` | `.env` → `ODOO_HOST` | public |
| `ODOO_DB` | `.env` → `ODOO_DB` | public |
| `ODOO_USERNAME` | `.env` → `ODOO_USERNAME` | secret |
| `ODOO_PASSWORD` | `.env` → `ODOO_PASSWORD` | secret |
| `ODOO_UID` | Set by auth pre-request script | secret |

**Never hard-code secrets in collection or request bodies.** Always reference `{{ODOO_PASSWORD}}`, `{{ODOO_UID}}`, etc.

## Odoo XML-RPC Request Structure

Odoo SaaS API uses JSON-RPC over HTTP POST. Standard request shape:

```json
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute_kw",
    "args": ["{{ODOO_DB}}", {{ODOO_UID}}, "{{ODOO_PASSWORD}}", "<model>", "<method>", [<args>], {<kwargs>}]
  }
}
```

Authentication endpoint: `{{ODOO_HOST}}/web/dataset/call_kw` (or `/xmlrpc/2/common` for auth).

## Collection Naming Conventions

| Context | Name Pattern |
|---|---|
| Feature gate collection | `Codoo – FEAT-<ID> – <Feature Name>` |
| Task automation | `Codoo – Task – <task-name>` |
| Reusable model testing | `Codoo – Model – <model.name>` |

## Gate Evidence Integration

API_TEST gate (Stage 4) evidence must be saved to `docs/logs/`. When a Postman collection run validates a gate:
- Export run results as JSON → save to `docs/logs/<feat>_api_test_<timestamp>.json`
- Reference collection ID in the feature report

## Postman MCP Limitations

- `createSpec` generates OpenAPI 3.x; Odoo XML-RPC is not REST, so specs are documentation-only
- Use `generateCollection` from a spec only when an OpenAPI spec already exists
- `createMock` is useful for offline testing but requires a published collection first (`publishMock`)

## References

- [AGENTS.md](../../AGENTS.md) — project onboarding and dual-repo rules
- [docs/guides/ARCHITECTURE.md](../../docs/guides/ARCHITECTURE.md) — Codoo 8-stage protocol
- [src/codoo/config.py](../../src/codoo/config.py) — env var names and defaults
- [.env.example](../../.env.example) — required environment variables
