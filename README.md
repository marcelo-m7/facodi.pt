# FACODI Monorepo

Monorepo oficial do projeto FACODI, com separacao clara entre plataforma publica, operacao interna e integracao com Odoo.

## Estrutura

- `frontend/`: aplicacao web publica do FACODI (React + Vite)
- `backend/`: servicos, APIs e integracoes de suporte (em evolucao)
- `workspace/`: ambiente operacional (Odoo, scraping, automacoes e utilitarios)
- `docs/`: documentacao transversal, institucional e de arquitetura

## Estado arquitetural atual

- O monorepo e a arquitetura oficial do projeto.
- Os cursos migrados para o Odoo fazem parte do estado atual, nao sao temporarios.
- O `frontend/` representa a experiencia publica.
- O `workspace/odoo/` concentra ingestao, normalizacao e sincronizacao operacional de curriculo.

Veja tambem:

- `docs/ARQUITETURA_MONOREPO_ODOO.md`
- `workspace/odoo/README.md`

## Quick Start

### Frontend

1. Entrar em `frontend/`
2. Instalar dependencias
3. Iniciar em desenvolvimento

```powershell
cd frontend
npm install
npm run dev
```

### Workspace operacional (Python)

1. Entrar em `workspace/`
2. Criar/ativar ambiente virtual
3. Instalar dependencias

```powershell
cd workspace
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Fluxo de dados (resumo)

1. Fontes curriculares e materiais sao extraidos e normalizados no `workspace/`.
2. Entidades curriculares e relacoes sao sincronizadas com Odoo em `workspace/odoo/`.
3. O site em `frontend/` consome os dados e metadados necessarios para apresentacao publica.

## Onboarding recomendado

1. Ler `docs/ARQUITETURA_MONOREPO_ODOO.md`.
2. Executar o frontend localmente.
3. Validar pipeline operacional em `workspace/odoo/README.md`.
4. Consultar documentos em `docs/` para contexto institucional.

