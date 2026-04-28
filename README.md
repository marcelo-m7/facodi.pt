# Codoo

Codoo is Corvanis' deterministic workflow for Odoo delivery with AI assistance.

The project standardizes feature execution with:
- specs-before-code contracts
- validation gates (install, API, UI, permissions)
- evidence logs in JSON
- dual-repo workflow (root + addon submodule)

## Repository Role

This repository is the orchestration layer:
- methodology and guides in docs/guides/
- evidence artifacts in docs/logs/
- CLI and task runtime in src/codoo/
- Odoo addon implementation in addon/ (git submodule)

Read these first:
- AGENTS.md
- docs/guides/CODOO.md
- docs/guides/ARCHITECTURE.md
- docs/guides/CONTRIBUTING.md

## Quick Start

### Linux/macOS

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
# edit .env: ODOO_HOST, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD
python -m codoo --help
python -m codoo task list
```

### Windows PowerShell

```powershell
python -m venv .venv
& .venv\Scripts\Activate.ps1
pip install -e .
Copy-Item .env.example .env
# edit .env: ODOO_HOST, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD
python -m codoo --help
python -m codoo task list
```

## Preflight Checks

```bash
python --version
git --version
test -f .venv/bin/activate || test -f .venv/Scripts/Activate.ps1
python -c "import xmlrpc.client; print('xmlrpc: OK')"
test -f .env
```

Connectivity check:

```bash
python - <<'PY'
import os
import xmlrpc.client
from dotenv import load_dotenv

load_dotenv()
host = os.getenv("ODOO_HOST")
db = os.getenv("ODOO_DB")
user = os.getenv("ODOO_USERNAME")
pwd = os.getenv("ODOO_PASSWORD")

assert all([host, db, user, pwd]), "Missing required ODOO_* variables in .env"
uid = xmlrpc.client.ServerProxy(f"{host}/xmlrpc/2/common").authenticate(db, user, pwd, {})
print("authenticate:", "OK" if uid else "FAILED")
PY
```

## Task Runtime

Operational automation is task-based under src/codoo/tasks/.

Use deterministic modes:
- inspect
- dry-run
- apply
- verify

Examples:

```bash
python -m codoo task list
python -m codoo task run --name <task-name> --mode inspect
python -m codoo task run --name <task-name> --mode dry-run
python -m codoo task run --name <task-name> --mode apply
python -m codoo task run --name <task-name> --mode verify
```

Evidence logs must be written to docs/logs/.

## Dual-Repo Workflow

Important boundary:
- addon/ changes belong to Corvanis/marcor and must be committed from addon/
- root changes belong to Corvanis/Codoo and must be committed from repository root

If addon/ is empty after clone:

```bash
git submodule update --init --recursive
```

## Documentation Map

- docs/guides/INDEX.md
- docs/guides/CODOO.md
- docs/guides/ARCHITECTURE.md
- docs/guides/CONTRIBUTING.md
- docs/guides/SECURITY.md
- docs/guides/FAQ.md
- docs/guides/ODOO-SAAS-LIMITATIONS.md

## Development Notes

- Do not commit .env or credentials
- Treat docs/odoo/ and docs/documentation/ as read-only mirrors unless explicitly requested
- Validate Python syntax after non-trivial edits:

```bash
python -m py_compile src/codoo/odoo/studio.py
```

## License

See the repository license files for applicable terms.
