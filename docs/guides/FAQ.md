# FAQ

## Geral

### O que e este repositorio?

Repositorio unico do projeto FACODI com:
- runtime/tarefas Codoo em Python (`src/codoo/`)
- frontend React/Vite (`frontend/`)
- guias e evidencias (`docs/`)

### Existe subrepositorio `addon/`?

Nao. O fluxo atual e single-repo.

### Quais documentos devo ler primeiro?

1. [AGENTS.md](../../AGENTS.md)
2. [CODOO.md](./CODOO.md)
3. [CONTRIBUTING.md](./CONTRIBUTING.md)
4. [ARCHITECTURE.md](./ARCHITECTURE.md)

## Ambiente

### Como validar credenciais Odoo?

Use `authenticate()` via XML-RPC, nao GET simples em endpoint.

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

### Onde ficam as evidencias?

Em `docs/logs/`, com nome por task/mode/timestamp.

### Posso commitar `.env` ou `.env.local`?

Nao. Nunca commitar credenciais.

## Frontend

### Quais comandos principais?

```bash
cd frontend
npm install
npm run dev
npm run build
npm run test:e2e
```

### Onde ficam as regras de integracao com Odoo?

- [odoo-elearning-frontend.instructions.md](../../.github/instructions/odoo-elearning-frontend.instructions.md)
- [odoo-elearning.instructions.md](../../.github/instructions/odoo-elearning.instructions.md)

## Tasks e Fluxo

### Qual ordem usar em tasks mutaveis?

Sempre: `inspect` -> `dry-run` -> `apply` -> `verify`.

### O que fazer se algum gate falhar?

Corrigir, reexecutar e registrar evidencia. Em caso de limite SaaS persistente, documentar o bloqueio e workaround.
