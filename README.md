# FACODI

FACODI (Faculdade Comunitaria Digital) e uma plataforma educacional open-source com foco em acesso gratuito e curadoria de trilhas academicas.

Este repositorio junta dois blocos principais:
- Runtime e automacao Codoo em Python (orquestracao e tarefas Odoo)
- Aplicacao frontend em React + Vite para experiencia do catalogo

## Visao do Projeto

O projeto organiza cursos e unidades curriculares com foco em:
- Estrutura curricular clara
- Conteudo aberto e reutilizavel
- Integracao com Odoo e-learning
- Execucao rastreavel via evidencias em JSON

Contexto institucional:
- [docs/FACODI.md](docs/FACODI.md)

## Status Atual e Proximos Passos

Status em 28/04/2026:
- Frontend funcional com fallback resiliente para mock data.
- Estado de carregamento no catalogo aplicado para evitar falso vazio.
- Integracao Odoo mantida como fonte de verdade para dados live.

Execucao prioritaria de hoje:
1. Atualizar documentacao de status e roadmap curto.
2. Enriquecer a UC LESTI "Analise Matematica II" (19411008) com videos curados.
3. Persistir `video_url` no Odoo via fluxo auditavel.
4. Consolidar evidencias em `docs/logs/` e relatorio diario.

Referencias de acompanhamento:
- [docs/plans/2026-04-28-implementation-status.md](docs/plans/2026-04-28-implementation-status.md)
- [docs/plans/EXECUTIVE_SUMMARY.md](docs/plans/EXECUTIVE_SUMMARY.md)

## Arquitetura Atual

Separacao principal de responsabilidades:
- `frontend/`: SPA React + Vite (UI, navegacao, experiencia do catalogo)
- `src/codoo/`: CLI Python, core runtime, tasks operacionais e cliente Odoo
- `docs/`: guias, metodologia, planos e logs de evidencia
- `.agents/` e `.github/`: skills, prompts, agentes e instrucoes operacionais

Documentos de referencia:
- [AGENTS.md](AGENTS.md)
- [docs/guides/ARCHITECTURE.md](docs/guides/ARCHITECTURE.md)
- [docs/guides/CODOO.md](docs/guides/CODOO.md)
- [docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md)

## Setup Rapido

### 1) Runtime Python (raiz)

Linux/macOS:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
python -m codoo --help
python -m codoo task list
```

Windows PowerShell:
```powershell
python -m venv .venv
& .venv\Scripts\Activate.ps1
pip install -e .
Copy-Item .env.example .env
python -m codoo --help
python -m codoo task list
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Comandos adicionais:
```bash
npm run build
npm run preview
npm run test:e2e
```

## Configuracao de Ambiente

Variaveis essenciais em `.env` (raiz):
- `ODOO_HOST`
- `ODOO_DB`
- `ODOO_USERNAME`
- `ODOO_PASSWORD`

Variaveis comuns em `frontend/.env.local`:
- `VITE_DATA_SOURCE` (`mock` ou `odoo`)
- `VITE_BACKEND_URL`

Nao commitar `.env` nem `.env.local`.

## Execucao de Tasks (Codoo)

Modo recomendado para tasks mutaveis:
1. `inspect`
2. `dry-run`
3. `apply`
4. `verify`

Exemplo:
```bash
python -m codoo task run --name <task-name> --mode inspect
python -m codoo task run --name <task-name> --mode dry-run
python -m codoo task run --name <task-name> --mode apply
python -m codoo task run --name <task-name> --mode verify
```

Evidencias devem ficar em `docs/logs/`.

## Integracao Frontend + Odoo

Regras de integracao e mapeamento:
- [.github/instructions/odoo-elearning-frontend.instructions.md](.github/instructions/odoo-elearning-frontend.instructions.md)
- [.github/instructions/odoo-elearning.instructions.md](.github/instructions/odoo-elearning.instructions.md)

## Estrutura do Repositorio

```text
.
├─ frontend/
├─ src/codoo/
├─ tests/
├─ docs/
├─ .agents/
└─ .github/
```

## Onboarding Rápido para Novos Colaboradores

1. Ler [AGENTS.md](AGENTS.md)
2. Rodar setup Python e frontend
3. Confirmar acesso Odoo com `authenticate()`
4. Ler [docs/guides/CODOO.md](docs/guides/CODOO.md)
5. Seguir [docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md)

## Observacoes Importantes

- `docs/odoo/**` e `docs/documentation/**` sao espelhos de referencia (nao editar sem pedido explicito).
- Em validacoes UI, sempre verificar erros no console do browser.
- Depois de alteracoes Python significativas, executar `python -m py_compile <arquivo>`.

## Licenca

Ver arquivos de licenca do repositorio.
