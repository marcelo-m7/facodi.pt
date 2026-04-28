# CONTRIBUTING

Guia de contribuicao para o repositorio FACODI.

## 1) Principios

1. Determinismo: mesma entrada, mesma saida.
2. Evidencia: logs e validacoes obrigatorias para mudancas relevantes.
3. Seguranca: nunca expor segredos.
4. Clareza: commits e PRs objetivos.

## 2) Fluxo de Trabalho

### Branches

- `feat/<id-ou-descricao>`
- `fix/<descricao>`
- `docs/<descricao>`
- `chore/<descricao>`

### Commits

Usar Conventional Commits:

```text
feat(scope): descricao
fix(scope): descricao
docs(scope): descricao
chore(scope): descricao
test(scope): descricao
```

### Pull Request

Antes de abrir PR:
- garantir que os testes/comandos relevantes rodaram
- atualizar docs impactadas
- incluir riscos/limites conhecidos
- referenciar spec/issue quando houver

## 3) Execucao de Tasks Codoo

Para tasks mutaveis, seguir ordem:
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

Salvar evidencias em `docs/logs/`.

## 4) Frontend

Comandos principais:

```bash
cd frontend
npm install
npm run dev
npm run build
npm run test:e2e
```

Regras de integracao Odoo:

- [odoo-elearning-frontend.instructions.md](../../.github/instructions/odoo-elearning-frontend.instructions.md)
- [odoo-elearning.instructions.md](../../.github/instructions/odoo-elearning.instructions.md)

## 5) Validacao Minima por Tipo de Mudanca

- Python/Codoo:
  - `python -m py_compile <file>` nos arquivos alterados
  - comando(s) de task afetada
- Frontend:
  - `npm run build`
  - `npm run test:e2e` (quando aplicavel)
- Documentacao/agentes:
  - links e referencias coerentes
  - sem instrucoes conflitantes com arquitetura atual

## 6) Limites e Regras

- Nao editar `docs/odoo/**` e `docs/documentation/**` sem pedido explicito.
- Nao commitar `.env` ou `.env.local`.
- Em Odoo SaaS, documentar claramente limitacoes e fallbacks quando surgirem.
