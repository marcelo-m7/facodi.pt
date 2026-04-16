# FACODI Odoo Workspace

Pipeline operacional para integracao curricular do FACODI com Odoo.

## Conteudo desta pasta

- `odoo_curriculum_schema.py`: modelos tipados das entidades curriculares.
- `odoo_test_utils.py`: utilitarios para autenticacao e chamadas XML-RPC.
- `test_odoo_connection.py`: valida conectividade e autenticacao no Odoo.
- `test_odoo_model_access.py`: valida acesso basico a modelos.
- `test_odoo_safe_write_probe.py`: valida escrita segura sem alterar conteudo funcional.
- `scripts/extract_facodi_curriculum.py`: extrai dados curriculares para JSON/CSV.
- `scripts/normalize_ids.py`: gera IDs normalizados e external IDs estaveis.
- `scripts/import_curriculum_to_odoo.py`: importa dados para Odoo (dry-run ou apply).
- `scripts/verify_odoo_curriculum_sync.py`: verifica reconciliacao entre esperado e Odoo.
- `scripts/extract_ualg_plan.py`: parser auxiliar de plano textual UAlg.

## Dependencias

A partir da raiz do monorepo:

```powershell
cd workspace
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Variaveis de ambiente esperadas

- `ODOO_HOST`
- `ODOO_DB`
- `ODOO_USERNAME`
- `ODOO_PASSWORD`

As configuracoes sao lidas de `.env.local` quando disponivel.

## Fluxo recomendado

A partir de `workspace/odoo/`:

1. Testar conectividade

```powershell
python test_odoo_connection.py
python test_odoo_model_access.py
python test_odoo_safe_write_probe.py
```

2. Extrair curriculo

```powershell
python scripts/extract_facodi_curriculum.py
```

3. Normalizar IDs

```powershell
python scripts/normalize_ids.py
```

4. Importar em dry-run

```powershell
python scripts/import_curriculum_to_odoo.py
```

5. Aplicar importacao

```powershell
python scripts/import_curriculum_to_odoo.py --apply
```

6. Modo incremental (rotina recorrente)

```powershell
python scripts/import_curriculum_to_odoo.py --apply --incremental
```

7. Verificar sincronizacao

```powershell
python scripts/verify_odoo_curriculum_sync.py
```

## Documentacao complementar

- `docs/ODOO_DATA_MODEL.md`
- `docs/PHASE_1_CHECKLIST.md`
