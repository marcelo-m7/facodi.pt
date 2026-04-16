# Backend

API de suporte para o frontend consumir dados persistidos no Odoo via XML-RPC.

## O que foi criado

- Servico FastAPI em `backend/odoo_api/main.py`
- Cliente XML-RPC em `backend/odoo_api/odoo_client.py`
- Endpoints CRUD genericos por modelo Odoo
- Healthcheck para validar conectividade e autenticacao

## Endpoints principais

- `GET /health`: valida versao do servidor e autenticacao
- `POST /models/{model}/search_read`: listar/filtrar registros
- `GET /models/{model}/{record_id}`: obter 1 registro
- `POST /models/{model}`: criar registro
- `PATCH /models/{model}/{record_id}`: atualizar registro
- `DELETE /models/{model}/{record_id}`: remover registro

## Setup

1. Criar/ativar ambiente virtual na raiz (se ainda nao estiver ativo)
2. Instalar dependencias do backend

```powershell
cd backend
pip install -r requirements.txt
```

3. Garantir variaveis em `.env.local` na raiz do monorepo:

- `ODOO_HOST`
- `ODOO_DB`
- `ODOO_USERNAME`
- `ODOO_PASSWORD`

4. Executar API local

```powershell
cd backend
uvicorn odoo_api.main:app --reload --host 0.0.0.0 --port 8080
```

5. Testar health

```powershell
curl http://localhost:8080/health
```

## Observacao sobre `/doc`

Na instancia atual, `https://edu-facodi.odoo.com/doc` responde como pagina de website/login, nao como referencia tecnica da API externa.
Por isso, este backend segue o contrato oficial de External API do Odoo (XML-RPC: `authenticate` + `execute_kw`).

