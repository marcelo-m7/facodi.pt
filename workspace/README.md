# Workspace Operacional

Area de trabalho operacional do monorepo FACODI.

## Objetivo

Concentrar fluxos internos que suportam o produto publico, incluindo integracao com Odoo, scraping, normalizacao de dados e utilitarios de operacao.

## Subareas

- `odoo/`: pipeline de extracao, normalizacao e importacao/sincronizacao curricular no Odoo.
- `Scrape-UAlg-Courses/`: scraper e API auxiliar para dados de cursos da UAlg.
- `requirements.txt`: dependencias Python compartilhadas para scripts deste nivel.

## Quando usar

- Use `workspace/odoo/` para manutencao da base curricular e sincronizacao Odoo.
- Use `workspace/Scrape-UAlg-Courses/` para coleta/transformacao de dados de origem UAlg.

## Dependencias

```powershell
cd workspace
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```
