---
name: codoo-dual-repo-commit
description: "Use when: committing changes that span both Codoo root and addon/ subrepo; need exact push/branch sequence to keep repos in sync; want preflight validation before commits."
---

# Dual-Repo Commit Helper

## Task

Generate a safe, step-by-step commit/push sequence for changes that touch both:
- **Root** (Codoo): specs, `src/codoo/`, docs, workspace, root configs
- **Addon** (Marcor): addon code under `addon/`

This prevents sync drift and ensures changes are committed in the correct repo.

## Input

Describe what changed:
- List of changed files (or let me scan git status)
- Feature/fix brief description
- Any special considerations (breaking changes, migrations, etc.)

Example:
```
Files: src/codoo/tasks/projects/implement_x.py, addon/codoo/models/x.py, docs/features/spec-x.yaml
Desc: Implement project delivery hooks
Note: Includes new model field; needs migration
```

## Output

A numbered sequence with:
1. **Preflight checks** (abort if any fail)
2. **Addon changes** (if any; commit from `addon/`)
3. **Root changes** (commit from root)
4. **Verification** (confirm both repos pushed)

## Example Sequence

```
PREFLIGHT:
  [ ] git status --short in root: only expected files modified
  [ ] git status --short in addon/: only addon/* files modified
  [ ] No uncommitted changes in .gitignore patterns

STEP 1: Addon Commit (from addon/)
  $ cd addon
  $ git add models/ views/
  $ git commit -m "feat: add delivery hooks to project

    - Add on_state_change hook for project records
    - Update __manifest__.py version
    - Tests: test_delivery_hooks_api.py passes"
  $ git push origin main
  $ cd ..

STEP 2: Root Commit (from root)
  $ git add src/codoo/tasks/ docs/
  $ git commit -m "feat: implement project delivery hooks

    - Add implement_delivery_hooks task orchestrator
    - Update spec-FEAT-delivery.yaml with evidence
    - All gates pass: API, UI, permissions, logs"
  $ git push origin main

VERIFICATION:
  ✓ addon/ main: latest commit matches repo
  ✓ root main: latest commit matches repo
  ✓ No divergence between repos
```

## References

- [docs/guides/CONTRIBUTING.md](../../docs/guides/CONTRIBUTING.md#L36-L50) (dual-repo workflow examples)
- [AGENTS.md](../../AGENTS.md#L19-L26) (dual-repo rule)
- [docs/guides/CODOO.md](../../docs/guides/CODOO.md) (feature validation gates)
