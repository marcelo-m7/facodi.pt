---
name: postman-odoo
description: "Generate Postman collections, environments, and specs for Odoo XML-RPC API testing in Codoo projects. Use when creating API gate evidence, documenting Odoo model operations, building Postman test suites for feature delivery, or scaffolding a Postman environment from .env. Triggers: 'create postman collection', 'postman for odoo', 'api gate collection', 'document odoo api', 'postman environment', 'postman MCP'."
---

# Postman Odoo Skill

Scaffolds Postman collections and environments for Odoo XML-RPC API testing in Codoo projects.

## When to Use

- Creating API_TEST gate evidence (Codoo Stage 4) for a feature spec
- Documenting CRUD operations for an Odoo model
- Building a Postman collection to replace or complement `docs/logs/` JSON evidence
- Onboarding a new team member to the API surface

## Procedure

### Step 1 — Discover the Postman workspace

```
getWorkspaces → identify or confirm target workspace (e.g., "Corvanis")
```

If no workspace exists, create one:
```
createWorkspace(name="Corvanis", type="personal|team")
```

### Step 2 — Create the Postman environment

Create an environment with Odoo credentials as variables. Read values from `.env` / `.env.example`:

```
createEnvironment(
  workspace=<workspaceId>,
  environment={
    name: "Codoo – <ODOO_HOST instance name>",
    values: [
      { key: "ODOO_HOST",     value: "<from .env>",  type: "default" },
      { key: "ODOO_DB",       value: "<from .env>",  type: "default" },
      { key: "ODOO_USERNAME", value: "",              type: "secret"  },
      { key: "ODOO_PASSWORD", value: "",              type: "secret"  },
      { key: "ODOO_UID",      value: "",              type: "secret"  }
    ]
  }
)
```

> **Security:** Leave `ODOO_USERNAME`, `ODOO_PASSWORD`, and `ODOO_UID` empty — users fill them locally. Never commit real credentials.

### Step 3 — Create the collection

```
createCollection(
  workspace=<workspaceId>,
  collection={
    info: { name: "Codoo – FEAT-<ID> – <Feature Name>", schema: "..." },
    item: []   // populated in step 4
  }
)
```

### Step 4 — Add requests

Add one request per Odoo operation. Use this template for XML-RPC over HTTP:

**Authentication request** (always first):
```json
POST {{ODOO_HOST}}/web/dataset/call_kw
Body (raw JSON):
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "common",
    "method": "authenticate",
    "args": ["{{ODOO_DB}}", "{{ODOO_USERNAME}}", "{{ODOO_PASSWORD}}", {}]
  }
}
```
Post-response test script should save `pm.response.json().result` to `ODOO_UID`.

**CRUD request template**:
```json
POST {{ODOO_HOST}}/web/dataset/call_kw
Body:
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute_kw",
    "args": ["{{ODOO_DB}}", {{ODOO_UID}}, "{{ODOO_PASSWORD}}", "<model>", "<method>", [<args>], {}]
  }
}
```

Use `createCollectionRequest` for each operation (search_read, create, write, unlink).

### Step 5 — Add example responses (optional but recommended)

```
createCollectionResponse(collectionId, requestId, response={...})
```

### Step 6 — Save evidence

After running the collection:
- Export results JSON → `docs/logs/<feat>_api_test_<timestamp>.json`
- Reference the collection ID and environment ID in the feature report

## Naming Conventions

| Entity | Pattern |
|---|---|
| Workspace | `Corvanis` |
| Environment | `Codoo – <instance shortname>` (e.g., `Codoo – marcorv`) |
| Feature collection | `Codoo – FEAT-<ID> – <Feature Name>` |
| Task collection | `Codoo – Task – <task-name>` |
| Model collection | `Codoo – Model – <model.name>` |

## MCP Tools Quick Map

| Goal | Tool |
|---|---|
| List workspaces | `getWorkspaces` |
| Get a workspace | `getWorkspace` |
| List collections | `getCollections` |
| Get a collection | `getCollection` |
| Create collection | `createCollection` |
| Add request | `createCollectionRequest` |
| Add response | `createCollectionResponse` |
| Create environment | `createEnvironment` |
| Update environment | `putEnvironment` |
| Generate from spec | `generateCollection` |
| Create mock server | `createMock` + `publishMock` |
| Sync collection↔spec | `syncCollectionWithSpec` |

## References

- [AGENTS.md](../../../AGENTS.md) — onboarding, dual-repo rules, gate protocol
- [docs/guides/ARCHITECTURE.md](../../../docs/guides/ARCHITECTURE.md) — 8-stage execution protocol
- [.github/instructions/postman-mcp.instructions.md](../../instructions/postman-mcp.instructions.md) — always-on Postman conventions
- [.env.example](../../../.env.example) — environment variable names
