# Odoo SaaS Limitations and Fallbacks

This guide defines how Codoo should handle platform constraints when developing or configuring Odoo instances for Corvanis clients.

## Purpose

- Keep delivery deterministic when SaaS restrictions block custom code paths.
- Ensure limitations are reported with evidence, not assumptions.
- Provide consistent fallback options for client-facing outcomes.

## Common Limitation Patterns

### Addon installation or upgrade is blocked

Symptoms:
- Import appears successful but model or access XML IDs are missing.
- Module state does not reflect expected Python model registration.

Expected handling:
- Capture install logs and exact error evidence.
- Validate whether XML or CSV resources loaded without full Python model availability.

### XML-RPC endpoint appears unhealthy through HTTP GET checks

Symptoms:
- GET returns 405 from XML-RPC endpoints.

Expected handling:
- Use `authenticate()` behavior checks instead of GET status assumptions.
- Report authentication result as the health signal.

### Feature depends on server-side Python not available in SaaS context

Symptoms:
- Custom business logic cannot be executed as designed.

Expected handling:
- Document constraint and choose one fallback path:
  - API-first orchestration workaround
  - Native Odoo configuration alternative
  - Hard limitation with explicit business impact

## Deterministic Recovery Policy

1. Reproduce and log the failure with timestamped evidence.
2. Apply one concrete fix or fallback change.
3. Re-run relevant gates.
4. Stop after 3 failed reruns and escalate as platform limitation.

## Evidence Requirements

For every limitation event, provide:

- Operation attempted
- Environment context (SaaS instance and target module/feature)
- Raw error or response summary
- Retry count and what changed between attempts
- Final decision (workaround or hard limitation)
- Path to logs in `docs/logs/`

## Communication Template

Use this structure in feature reports:

- Limitation: what failed and where
- Evidence: log path and key error snippet
- Impact: what requirement is affected
- Resolution: workaround implemented, or hard limitation accepted
- Next action: optional follow-up if platform capabilities change

## Related References

- [CODOO.md](CODOO.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [FAQ.md](FAQ.md)
- [SECURITY.md](SECURITY.md)
- [docs/features/execution-protocol.md](../features/execution-protocol.md)
