# FACODI Odoo Data Model (Phase 1)

## Objective
Map curriculum entities from facodi.pt to Odoo eLearning models with idempotent imports.

## Entity Mapping

- Course (LESTI): `slide.channel`
- UC: `slide.slide`
- Topic: `slide.slide`

## External IDs

- Course: `facodi.course_<course_slug>`
- UC: `facodi.uc_<uc_code>`
- Topic: `facodi.topic_<uc_code>_<topic_slug>`

External IDs are persisted via `ir.model.data` to guarantee re-runs update existing records instead of creating duplicates.

## Field Strategy

The importer introspects `fields_get` and only writes fields that:

1. exist in the target model
2. are not readonly

This allows the pipeline to run across different Odoo instances without hard failures on missing custom fields.

## Pipeline Outputs

Raw extraction:

- `Projects/facodi/data/curriculum_bundle_raw.json`
- `Projects/facodi/data/curriculum_ucs.csv`
- `Projects/facodi/data/curriculum_topics.csv`
- `Projects/facodi/data/curriculum_playlists.csv`

Normalized bundle:

- `Projects/facodi/data/curriculum_bundle_normalized.json`

## Import Modes

Dry-run (default):

- Builds payloads
- Resolves model availability
- Reports what would be created/updated

Apply mode (`--apply`):

- Executes create/write operations
- Updates `ir.model.data` links

## Notes

- Install Odoo eLearning module before import if `slide.channel` and `slide.slide` are unavailable.
- Use custom fields prefixed with `x_facodi_` if additional FACODI metadata must be stored directly in Odoo.
