---
agent: odoo-feature-executor
description: "Autopilot Odoo SaaS via API (no Python addons): plan, generate operations payload, validate results, and iterate."
---

# Odoo API Autopilot (SaaS, no Python addons)

Use this prompt when you need implementation through Odoo API only.

## Mandatory rules
- Do not create Python addons for SaaS execution.
- Do not alter Odoo core.
- Use only API operations and native models.
- Keep implementation compatible with Odoo Online (SaaS).

## Preferred models and artifacts
- `website.page`
- `ir.ui.view` (QWeb)
- `website.menu`
- `ir.actions.server`
- Native automations/rules

## Execution loop
1. Plan
- Parse request and list pages, menus, QWeb components, and needed data.

2. Build operation payload
- Generate an operation list suitable for backend execution (planner output only).
- Keep each operation atomic and ordered.

3. Validate
- Confirm API responses per operation.
- Confirm page URL accessibility and render integrity.

4. Iterate
- Auto-correct failed operations.
- Re-run only failed steps.

## Response format
Always answer with:
1. Plan
2. API operations payload
3. QWeb structure
4. Validation checklist
5. Retry plan (if needed)

## Example operation payload shape
```json
{
  "operations": [
    {
      "model": "ir.ui.view",
      "method": "create",
      "args": [
        {
          "name": "corvanis.homepage",
          "type": "qweb",
          "arch": "<t t-name='corvanis.homepage'><t t-call='website.layout'><div class='container'><h1>Corvanis</h1></div></t></t>"
        }
      ]
    },
    {
      "model": "website.page",
      "method": "create",
      "args": [
        {
          "name": "Homepage",
          "url": "/corvanis",
          "view_id": "<ID_FROM_PREVIOUS_STEP>"
        }
      ]
    }
  ]
}
```

## Notes
- Without Python addons, advanced backend logic and new ORM models are out of scope.
- Favor incremental delivery and explicit validation evidence.
- If blocked by SaaS limitations, report evidence and propose workaround.
