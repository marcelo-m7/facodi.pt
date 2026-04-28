# Codoo/FACODI Setup Guide

## 1) Prerequisites

- Python 3.11+
- Node.js 20+
- Git
- Access to target Odoo instance credentials

Quick check:

```bash
python --version
node --version
git --version
```

## 2) Clone and Install (Root)

```bash
git clone <repo-url>
cd facodi.pt
python -m venv .venv
```

Linux/macOS:

```bash
source .venv/bin/activate
pip install -e .
```

Windows PowerShell:

```powershell
& .venv\Scripts\Activate.ps1
pip install -e .
```

## 3) Configure `.env` (Root)

```bash
cp .env.example .env
```

Required keys:

```dotenv
ODOO_HOST=https://your-instance.odoo.com
ODOO_DB=your-db
ODOO_USERNAME=your-user
ODOO_PASSWORD=your-password-or-app-token
```

Never commit `.env`.

## 4) Validate Codoo Runtime

```bash
python -m codoo --help
python -m codoo task list
```

Optional connectivity check:

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

uid = xmlrpc.client.ServerProxy(f"{host}/xmlrpc/2/common").authenticate(db, user, pwd, {})
print("authenticate:", "OK" if uid else "FAILED")
PY
```

## 5) Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Other commands:

```bash
npm run build
npm run preview
npm run test:e2e
```

Frontend env (optional):

```dotenv
VITE_DATA_SOURCE=mock
VITE_BACKEND_URL=http://localhost:8080
```

## 6) Deterministic Task Modes

For mutable operations, keep this order:
1. `inspect`
2. `dry-run`
3. `apply`
4. `verify`

Example:

```bash
python -m codoo task run --name import-products --mode inspect
python -m codoo task run --name import-products --mode dry-run
python -m codoo task run --name import-products --mode apply
python -m codoo task run --name import-products --mode verify
```

Evidence logs should be written to `docs/logs/`.

## 7) Troubleshooting

- XML-RPC endpoint returning HTTP 405 on GET is expected. Validate with `authenticate()`.
- If Python runtime breaks after large edits, run `python -m py_compile <file>`.
- For frontend/Odoo catalog integration rules, follow:
  - [odoo-elearning-frontend.instructions.md](../../.github/instructions/odoo-elearning-frontend.instructions.md)
  - [odoo-elearning.instructions.md](../../.github/instructions/odoo-elearning.instructions.md)
