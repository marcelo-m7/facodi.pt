# FACODI Phase 1 Checklist

## Environment

- [ ] `.env.local` has valid `ODOO_HOST`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_PASSWORD`
- [ ] Odoo connection test passes
- [ ] Odoo model access test passes

## Data Extraction

- [ ] Run `extract_facodi_curriculum.py`
- [ ] Confirm `curriculum_bundle_raw.json` generated
- [ ] Confirm CSV files generated (UCs, topics, playlists)

## Normalization

- [ ] Run `normalize_ids.py`
- [ ] Confirm `curriculum_bundle_normalized.json` generated
- [ ] Confirm `issues_count` is acceptable (ideally 0)

## Odoo Import

- [ ] Run `import_curriculum_to_odoo.py` in dry-run mode
- [ ] Validate model checks (`slide.channel`, `slide.slide`)
- [ ] Validate summary (`would_create` / `would_update`)
- [ ] Run with `--apply` only after dry-run validation

## Validation

- [ ] Course entity visible in Odoo eLearning
- [ ] UC entries visible and linked
- [ ] Topic entries visible
- [ ] Re-run `--apply` and confirm no duplicates (updates only)
