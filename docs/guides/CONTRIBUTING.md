# CONTRIBUTING.md - Guia de Contribuição

## Bem-vindo ao Corvanis/Codoo

Este documento descreve como contribuir para este repositório de forma consistente, segura e rastreável.

---

## Princípios de Contribuição

1. **Determinístico**: Mesma entrada = mesma saída (specs YAML definem entrada)
2. **Rastreável**: Todas as mudanças têm evidência (logs, commits, PRs)
3. **Incremental**: Features pequenas, testes em cada gate, commits frequentes
4. **Seguro**: Credenciais nunca versionadas, testes executam em ambientes reais
5. **Documentado**: Cada feature gera spec, relatório e logs

---

## Tipos de Contribuições

### 1. Implementar uma Feature (Principal)

**Entrada:** Um arquivo `docs/features/spec-FEAT-[ID].yaml`

**Processo:**

```
1. Ler spec completamente
   └─ Entender scope, models, views, security, dependencies

2. Planejamento
   └─ Listar arquivos a criar/modificar
   └─ Identificar riscos
   └─ Verificar constraints

3. Implementação (em addon/)
   └─ Criar modelo Odoo com fields
   └─ Adicionar security (groups, ACL)
   └─ Criar views (XML)
   └─ Adicionar dados iniciais
   └─ Commits pequenos (1 commit por componente)

4. Instalação
   └─ Executar script de instalação
   └─ Verificar logs

5. Testes API
   └─ Executar CRUD conforme spec
   └─ Testar permissões
   └─ Salvar logs JSON

6. Testes UI
   └─ Login via navegador
   └─ Navegar novo menu
   └─ Criar/editar registros
   └─ Verificar JS errors

7. Documentação
   └─ Escrever docs/features/feature-[ID].md
   └─ Incluir logs de testes
   └─ Documentar problemas/fixes

8. Commits e Push
   └─ addon/ → commit/push em addon (Corvanis/marcor)
   └─ docs/ → commit/push em raiz (Corvanis/Codoo)
```

**Critério de Aceitação:**
- ✅ Todos os gates obrigatórios passam (instalar, API, UI, permissions)
- ✅ Spec atende 100%
- ✅ Logs salvos em `docs/[feature]_*.json`
- ✅ Relatório em `docs/features/feature-[ID].md`
- ✅ Commits estruturados (conventional commits)
- ✅ PRs abertas e prontas para review

**Referência:** [AGENTS.md - Seção 5](AGENTS.md#5-como-implementar-uma-feature-passo-a-passo)

### 2. Corrigir um Bug

**Se o bug está em código Odoo (addon/):**
```powershell
cd addon/
git checkout -b bugfix/[descricao-curta]
# Fazer fix
git add .
git commit -m "fix: [descricao-curta]"
git push origin bugfix/[descricao-curta]
# Abrir PR em Corvanis/marcor
```

**Se o bug está em script/docs (raiz):**
```powershell
git checkout -b bugfix/[descricao-curta]
# Fazer fix
git add .
git commit -m "fix: [descricao-curta]"
git push origin bugfix/[descricao-curta]
# Abrir PR em Corvanis/Codoo
```

### 3. Melhorar Documentação

**Sem código-fonte alterado:**
```powershell
git checkout -b docs/[descricao-curta]
# Editar .md files ou criar novos
git add .
git commit -m "docs: [descricao-curta]"
git push origin docs/[descricao-curta]
```

**Com código-fonte alterado:**
- Aplique as mesmas regras acima, sincronizando ambos os repos

### 4. Adicionar ou Estender Task de Automação

**Local canônico:** `src/codoo/tasks/` (tasks Python executadas por CLI)

**Estrutura recomendada:**
- `src/codoo/tasks/<dominio>/<task>.py`
- classe herdando de `codoo.tasks.base.Task`
- modos implementados: `inspect`, `dry-run`, `apply`, `verify`

**Requisitos:**
1. Imports no topo (logging, xmlrpc, etc)
2. Docstring descrevendo propósito
3. Tratamento de erro claro
4. Salvar logs em `docs/[script]_log.json`
5. Print status em stdout para rastreabilidade
6. Usar credenciais de `.env`

**Exemplo:**
```python
#!/usr/bin/env python3
"""
Valida conectividade XMLRPC ao Odoo.

Saída: docs/connectivity_check_log.json
"""

import json
import os
import xmlrpc.client
from datetime import datetime

log = {
    "timestamp": datetime.utcnow().isoformat(),
    "status": "PENDING",
    "tests": {},
    "errors": [],
}

try:
    # Testes aqui
    log["status"] = "SUCCESS"
except Exception as e:
    log["status"] = "FAILED"
    log["errors"].append(str(e))

# Salvar
os.makedirs("docs", exist_ok=True)
with open("docs/connectivity_check_log.json", "w") as f:
    json.dump(log, f, indent=2)

print(f"[LOG] {log['status']}")
```

### 5. Estender Skills Locais

**Local:** `.agents/skills/`

**Referência:** [writing-skills SKILL.md](c:\Users\marce\Desktop\Workspace\Corvanis\Codoo\.agents\skills\writing-skills\SKILL.md)

---

## Convenção de Commits

Usar **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Tipos de Commit

| Tipo | Escopo | Exemplo |
|---|---|---|
| `feat` | addon, spec | `feat(corvanis_certificates): criar modelo com campos básicos` |
| `fix` | bug em código | `fix(codoo): corrigir validação de campo obrigatório` |
| `docs` | documentação | `docs(AGENTS): adicionar seção de troubleshooting` |
| `test` | testes/validação | `test(scripts): adicionar validação de permissões para project.task` |
| `chore` | build/manutenção | `chore: atualizar .env.example com novos campos` |
| `refactor` | reorganização | `refactor(models): extrair lógica comum para método helper` |
| `perf` | performance | `perf(api): adicionar índice em project.task.name` |

### Exemplo Bom

```
feat(codoo): implementar modelo corvanis.certificate com validação

Adiciona:
- Modelo corvanis.certificate com fields name, employee_id, issued_date
- Grupo de segurança certificate_user com permissões CRU
- View de lista e formulário
- Menu em HR > Certificados

Testes:
- API CRUD: OK
- UI navegação: OK
- Permissões: OK

Log: docs/codoo_api_test_log.json
```

### Exemplo Ruim ❌

```
"update"  # Vago, sem escopo
"fixed stuff"  # Sem informação
"URGENT FIX!!!"  # Sem detalhes
```

---

## Workflow de Branch

### Nomenclatura

```
main                  # Branch principal (sempre estável)
├─ feat/[ID]-[nome]   # Novas features
├─ fix/[descricao]    # Bugfixes
├─ docs/[descricao]   # Documentação
└─ chore/[descricao]  # Manutenção
```

### Criar Branch

```powershell
git checkout main
git pull origin main
git checkout -b feat/FEAT-0005-novo-modulo
```

### Fazer Commits Incrementais

```powershell
# Implementar 1 componente
git add addon/novo_modulo/models/
git commit -m "feat(novo_modulo): criar modelo principal"

# Adicionar outro componente
git add addon/novo_modulo/views/
git commit -m "feat(novo_modulo): adicionar views (list, form)"

# Adicionar security
git add addon/novo_modulo/security/
git commit -m "feat(novo_modulo): adicionar grupos e ACL"
```

### Fazer Push e PR

```powershell
git push origin feat/FEAT-0005-novo-modulo
# Ir ao GitHub e abrir PR para main
```

---

## Checklist de PR (Pull Request)

Antes de abrir um PR, verifique:

```
☐ Branch criado de `main` atualizado
☐ Todos os testes locais passam (API + UI)
☐ Commit messages seguem Conventional Commits
☐ Não há `.env` ou credenciais no código
☐ Documentação foi atualizada (feature-*.md, README, etc)
☐ Logs JSON salvos em docs/
☐ Não há conflicts com main
☐ Descrição de PR é clara e referencia spec (FEAT-ID)
☐ Se addon: subrepositório addon/ foi atualizado e syncronizado
```

---

## Validação de Qualidade

### Gates Obrigatórios por Tipo

| Tipo de Mudança | Gates Obrigatórios |
|---|---|
| **Feature (addon)** | Install ✅ Upgrade ✅ API CRUD ✅ API Permissions ✅ UI Flow ✅ No JS Errors ✅ |
| **Feature (no-code Studio)** | UI Flow ✅ No JS Errors ✅ |
| **Bug em addon** | Instalar sem erro ✅ Teste que prova fix ✅ |
| **Documentação** | Markdown válido ✅ Links funcionam ✅ Exemplos executáveis ✅ |
| **Script Python** | Syntax válido ✅ Testa com `.env` real ✅ Logs salvos ✅ |

### Como Executar Gates

```powershell
# 1. Install/API Gate (task-driven)
python -m codoo task run --name <task-name> --mode inspect
python -m codoo task run --name <task-name> --mode dry-run
python -m codoo task run --name <task-name> --mode apply
python -m codoo task run --name <task-name> --mode verify

# 2. Markdown Gate
Get-Content docs/features/feature-*.md | Select-String "^#" | Measure-Object

# 3. Python Syntax Gate
python -m py_compile src/codoo/tasks/<dominio>/<task>.py
```

---

## Sincronização entre Repos

### Cenário: Você cria um addon em `addon/`

```powershell
# Passo 1: Commit em addon/
cd addon/
git add .
git commit -m "feat: novo addon"
git push origin main

# Passo 2: Voltar para raiz e fazer seu próprio commit
cd ..
git add docs/features/feature-*.md
git commit -m "docs: relatorio do novo addon"
git push origin main

# Passo 3: Ambos os repos têm a mudança (pode ter commit hashes diferentes)
```

### Verificar Sincronização

```powershell
# Em raiz
git log --oneline -5

# Em addon/
cd addon/
git log --oneline -5
cd ..

# Ambos devem ter commits recentes
```

---

## Escalação e Review

### Submeter para Review

1. Abra PR no GitHub
2. Descreva:
   - Feature ID (ex: FEAT-0005)
   - O que foi feito
   - Testes passados
   - Links para logs em docs/
3. Aguarde feedback de code review

### Lidar com Feedback

Se reviewer pedir mudanças:

```powershell
# Fazer mudança
# Commit com mensagem clara
git commit -m "review: [descrição da mudança conforme feedback]"

# Push
git push origin [seu-branch]

# Não precisa reabrir PR, ela atualiza automaticamente
```

### Quando Merging

```powershell
# Apenas maintainers fazem isso, mas você pode solicitar:
git checkout main
git pull origin main
git merge --no-ff [seu-branch]  # Preserva histórico de branch
git push origin main
```

---

## Práticas Recomendadas

### ✅ Faça

- ✅ Commits pequenos (1 mudança lógica por commit)
- ✅ Teste localmente antes de push
- ✅ Descreva o "por quê" além do "o quê"
- ✅ Referencie IDs de feature (FEAT-000X)
- ✅ Mantenha logs JSON para rastreabilidade
- ✅ Revise seu próprio PR antes de submeter
- ✅ Responda feedback de review dentro de 24h

### ❌ Não Faça

- ❌ Commit de arquivos gerados (`.venv/`, `__pycache__/`)
- ❌ Commit de credenciais ou `.env`
- ❌ Força push em `main` (força push ok em seu branch)
- ❌ Mudança de código + mudança de documentação sem separar
- ❌ PR com múltiplas features não relacionadas
- ❌ Commit sem testar (especialmente em addon/)
- ❌ Reescrever histórico de commits públicos

---

## Dúvidas Frequentes

**P: Onde fico sabendo se meu PR foi aceito?**  
R: GitHub envia email. Verifique na aba "Pull Requests" do repo.

**P: E se cometer erro em um commit?**  
R: Use `git revert [commit-hash]` para desfazer sem alterar histórico.

**P: Preciso fazer commit em dois repos sempre?**  
R: Sim, se mudança toca ambos. Se é só addon/, só addon/. Se é só docs/, só raiz.

**P: Onde vejo os logs de teste dos outros?**  
R: Em `docs/` (JSON files). Cada PR referencia seus logs.

---

## Referências

- [AGENTS.md](AGENTS.md) - Guia completo para agentes
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura geral
- [CONTRIBUTING.md](CONTRIBUTING.md) - Protocolo de execução (8 stages)
- [spec-template.yaml](docs/features/spec-template.yaml) - Template de spec
- [README.md](README.md) - Visão geral rápida

---

**Versão:** 1.0  
**Data:** 21 de Abril de 2026  
**Maintainer:** Corvanis Development Team


