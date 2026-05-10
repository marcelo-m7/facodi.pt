---
description: "Use when preparing or validating frontend changes before handoff or PR. Triggers: validate my changes, run the dev checklist, review my branch readiness, quick regression check."
---
Run a focused frontend development workflow for this repository.

Goals:
1. Detect what changed.
2. Pick the smallest reliable validation profile.
3. Execute checks and summarize branch readiness.

Workflow:
1. Inspect changed files and categorize risk:
- UI-only component/layout/text updates
- Data-source or auth logic updates
- Routing/navigation/view-state updates
- Supabase-sensitive updates
2. Choose commands:
- UI-only: `pnpm build`
- Data/auth: `pnpm test:unit && pnpm build`
- Routing/navigation: `pnpm build && pnpm test:e2e`
- Supabase-sensitive: `pnpm security:check-rls && pnpm build`
3. Run commands with short purpose statements.
4. Report:
- What ran
- Pass/fail per command
- Blocking failures with likely root cause
- Next smallest fix step

Constraints:
- Do not edit product code unless the user explicitly asks for fixes.
- If `security:check-rls` is missing in the current branch, skip it and state why.
- Keep output concise and actionable.
