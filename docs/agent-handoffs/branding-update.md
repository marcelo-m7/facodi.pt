# Branding Update Report

Date: 2026-04-28

## Scope Executed

- Institutional branding updates from "Monynha Softwares" to "Open2 Technology".
- URL replacement from `https://monynha.com` to `https://open2.tech`.
- Standardization of legacy project GitHub owner/repository references to `marcelo-m7/facodi` where applicable.
- Context-aware updates only (no changes to technical identifiers that can affect runtime behavior).

## Files Changed and Change Type

1. `docs/FACODI.md`
- Branding text replacements (`Monynha Softwares` -> `Open2 Technology`).
- Institutional URL update (`monynha.com/...` -> `https://open2.tech`).

2. `frontend/README.md`
- Maintainer branding and website update.
- Community naming update.

3. `frontend/components/Contributors.tsx`
- Contributor organization name updated to `Open2 Technology`.

4. `frontend/components/Layout.tsx`
- Footer/community branding updates.
- Community link updated to `https://open2.tech`.

5. `frontend/data/i18n.ts`
- PT/EN content updates for branding strings and CTA labels.

6. `pyproject.toml`
- Project author metadata updated to `Open2 Technology`.
- URL metadata updated to:
  - Repository: `https://github.com/marcelo-m7/facodi`
  - Documentation: `https://open2.tech`
  - Issues: `https://github.com/marcelo-m7/facodi/issues`

7. `src/codoo/__init__.py`
- Package author/email metadata updated to Open2 Technology contact.

8. `docs/guides/CHANGELOG.md`
- Legacy repo naming and release URL updated to `marcelo-m7/facodi`.

9. `docs/features/build_executive_report_pdf.py`
- Author/company metadata strings updated to Open2 Technology.

## Verification Performed

- Global tracked-file grep validation for old branding/URL/legacy owner patterns:
  - `Monynha Softwares`
  - `Monynha`
  - `monynha.com`
  - `github.com/Corvanis`
  - `Corvanis/Codoo`
- Result: no tracked-file matches for those patterns.

- Runtime validation:
  - `python -m codoo --help` -> success.
  - `frontend` build (`npm run build`) -> success.

## Manual Review Points

1. Local non-tracked credential files were intentionally not edited:
- `.env`
- `frontend/.env.local`

Reason: these files are not versioned and may contain environment-specific credentials; automated branding replacement there can break real authentication.

2. Third-party references in skill/reference docs were not rewritten:
- Example: official Odoo docs URLs and external examples with non-project owners.

Reason: these are valid external references and not project-institution ownership metadata.

## Inconsistencies Found

1. Existing unrelated workspace changes detected during execution:
- `frontend/types.ts` was already modified outside this task.
- `frontend/test-results/` appears as untracked generated output.

These were not altered by this branding task.
