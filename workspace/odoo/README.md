# Facodi Odoo Test Scripts

This folder contains test scripts to validate Odoo connectivity and basic model access for the Facodi project.

It now also includes the first implementation of a curriculum ingestion pipeline for FACODI (Phase 1).

## Files

- test_odoo_connection.py: validates XML-RPC connection and authentication.
- test_odoo_model_access.py: validates basic read/write/create access probes on key models.
- test_odoo_safe_write_probe.py: validates safe write path by writing the same existing text value back to one record.
- odoo_test_utils.py: shared utilities for loading .env.local and calling XML-RPC.
- odoo_curriculum_schema.py: typed schema objects for FACODI curriculum entities.
- scripts/extract_facodi_curriculum.py: extracts curriculum data from facodi.pt markdown/YAML into JSON/CSV.
- scripts/normalize_ids.py: normalizes IDs and generates stable external IDs for idempotent imports.
- scripts/import_curriculum_to_odoo.py: imports normalized curriculum to Odoo in dry-run or apply mode.
- scripts/extract_ualg_plan.py: parses markdown-like UAlg plan rows into JSON/CSV.

## Expected env variables

- ODOO_HOST
- ODOO_DB
- ODOO_USERNAME
- ODOO_PASSWORD

The scripts try to load from:

1. Projects/facodi.pt/.env.local
2. .env.local at workspace root

## Run

From workspace root:

- c:/Users/marce/Desktop/Workspace/Corvanis/Projects/.venv/Scripts/python.exe ./Projects/facodi/test_odoo_connection.py
- c:/Users/marce/Desktop/Workspace/Corvanis/Projects/.venv/Scripts/python.exe ./Projects/facodi/test_odoo_model_access.py
- c:/Users/marce/Desktop/Workspace/Corvanis/Projects/.venv/Scripts/python.exe ./Projects/facodi/test_odoo_safe_write_probe.py

## Phase 1 Curriculum Pipeline

1. Extract curriculum from `Projects/facodi.pt/content/courses/lesti`:

- c:/Users/marce/Desktop/Workspace/Corvanis/Projects/.venv/Scripts/python.exe ./Projects/facodi/scripts/extract_facodi_curriculum.py

2. Normalize IDs and generate external IDs:

- c:/Users/marce/Desktop/Workspace/Corvanis/Projects/.venv/Scripts/python.exe ./Projects/facodi/scripts/normalize_ids.py

3. Dry-run Odoo import (default mode):

- c:/Users/marce/Desktop/Workspace/Corvanis/Projects/.venv/Scripts/python.exe ./Projects/facodi/scripts/import_curriculum_to_odoo.py

4. Apply Odoo import after validation:

- c:/Users/marce/Desktop/Workspace/Corvanis/Projects/.venv/Scripts/python.exe ./Projects/facodi/scripts/import_curriculum_to_odoo.py --apply

5. Incremental apply mode (recommended for recurring sync):

- c:/Users/marce/Desktop/Workspace/Corvanis/Projects/.venv/Scripts/python.exe ./Projects/facodi/scripts/import_curriculum_to_odoo.py --apply --incremental

6. Reconciliation and sync verification (expected vs actual in Odoo):

- c:/Users/marce/Desktop/Workspace/Corvanis/Projects/.venv/Scripts/python.exe ./Projects/facodi/scripts/verify_odoo_curriculum_sync.py

Optional: parse a UAlg markdown-like plan source file:

- c:/Users/marce/Desktop/Workspace/Corvanis/Projects/.venv/Scripts/python.exe ./Projects/facodi/scripts/extract_ualg_plan.py
