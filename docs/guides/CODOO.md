# CODOO — Desenvolvimento Odoo Estruturado com Agentes de IA

**Versão**: 1.0  
**Data**: Abril 2026  
**Público**: Developers, Agentes/LLMs, Tech Leads

---

## 1. O que é o Codoo?

**Codoo** é a metodologia da Corvanis para desenvolver em Odoo com agentes de IA de forma estruturada, previsível e rastreável.

O nome não é acidental:

| Letra | Significado |
|---|---|
| **C** | Corvanis — empresa que criou e usa a metodologia |
| **C** | Copilot — ferramenta de IA que acompanha o fluxo |
| **odoo** | Plataforma ERP sobre a qual se desenvolve |

> **Codoo não é apenas um repositório.** É uma forma de trabalhar: specs antes do código, validação antes do commit, documentação junto com a entrega.

### 1.1 O que o Codoo fornece

| Componente | Descrição |
|---|---|
| **Specs YAML** | Contratos de entrada para cada feature — o agente implementa exatamente o que está escrito |
| **Protocolo de execução** | 8 etapas determinísticas desde o spec até ao PR |
| **Gates de validação** | Instalação, API CRUD, UI, permissões — todos obrigatórios |
| **Logs rastreáveis** | JSON com evidências de cada gate para auditoria |
| **Skills especializados** | Knowledge bases para Odoo 19, revisão de código, brainstorming |
| **Relatórios de feature** | Documento gerado por feature com resultados e decisões |

### 1.2 O que o Codoo NÃO é

- ❌ Um gerador automático de código sem revisão
- ❌ Um substituto para conhecimento técnico de Odoo
- ❌ Um sistema de deploy autónomo para produção
- ❌ Uma ferramenta de prompt engineering genérica

---

## 2. O Problema que o Codoo Resolve

### 2.1 O cenário sem estrutura

Quando múltiplos developers usam IA no mesmo projeto Odoo, surgem padrões destrutivos:

```
Dev A usa IA → gera código X
Dev B usa IA → gera código Y (incompatível com X)
Dev C usa IA → não sabe o que A e B fizeram
Agente LLM → perde contexto entre sessões
Resultado → conflitos, retrabalho, perda de rastreabilidade
```

### 2.2 Os problemas concretos

| Problema | Impacto |
|---|---|
| **Contexto perdido entre sessões** | O agente não sabe o que foi feito antes — começa do zero |
| **Código não documentado** | Ninguém sabe porquê uma decisão foi tomada |
| **Múltiplos devs sem padrão** | Naming conventions diferentes, estruturas incompatíveis |
| **Ausência de validação** | Feature "funciona no meu ambiente" mas falha noutros |
| **PR sem contexto** | Revisor não sabe o que mudou nem porquê |
| **IA usada sem guardrails** | Código gerado sem segurança, sem testes, sem rastreabilidade |

### 2.3 O que o Codoo garante

```
Spec YAML → Contexto partilhado entre todos os devs e agentes
Protocol  → Mesmas etapas, mesma ordem, mesmos gates
Logs JSON → Evidência de que cada gate passou
Relatório → Explicação das decisões para o revisor
Branch    → Isolamento de cada feature
PR        → Contrato de entrega com contexto completo
```

> **Princípio central:** Um dev novo ou um agente sem histórico deve conseguir pegar num spec YAML e entregar a feature completa sem ambiguidade.

---

## 3. Setup Inicial

### 3.1 Pré-requisitos

| Requisito | Versão | Verificação |
|---|---|---|
| Python | 3.13+ | `python --version` |
| Git | qualquer recente | `git --version` |
| Acesso de rede | HTTPS para `marcorv.odoo.com` | `ping marcorv.odoo.com` |
| Credenciais Odoo | Email + password (app-specific se 2FA) | — |

### 3.2 Clonar os repositórios

A arquitectura é dual-repo: o repositório de orquestração contém o addon como subdiretório.

```powershell
# Clonar o repositório de orquestração (Codoo)
git clone https://github.com/Corvanis/Codoo.git
cd Codoo

# O subdiretório addon/ aponta para Corvanis/marcor
# Se não estiver populado, inicializar:
git clone https://github.com/Corvanis/marcor.git addon
```

> Ver [ARCHITECTURE.md](ARCHITECTURE.md) para detalhe completo da arquitectura dual-repo.

### 3.3 Configurar o ambiente Python

```powershell
# Criar e ativar virtualenv
python -m venv .venv
& .venv\Scripts\Activate.ps1

# Verificar Python
python --version  # esperado: 3.13+

# Instalar dependências (se existir requirements.txt)
pip install -r requirements.txt

# Nota: xmlrpc.client vem com Python — não requer pip
python -c "import xmlrpc.client; print('xmlrpc OK')"
```

### 3.4 Configurar credenciais (.env)

Criar o ficheiro `.env` na raiz do projeto (nunca commitar):

```bash
ODOO_HOST=https://marcorv.odoo.com
ODOO_DB=marcorv-main-31133906
ODOO_USERNAME=seu_email@corvanis.pt
ODOO_PASSWORD=sua_senha_ou_app_password
```

> ⚠️ Se 2FA estiver ativo no Odoo, gerar uma **app-specific password** em: Settings → My Profile → Account Security → App Passwords

Ver `.env.example` para o modelo completo.

### 3.5 Verificar conectividade com o Odoo

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

**Saída esperada:**
```
authenticate: OK
```

> ⚠️ **Pitfall conhecido:** Um GET simples em `/xmlrpc/2/common` devolve 405. Validar sempre com `authenticate()` — não com verificação HTTP de status.

---

## 4. Workflow com Agentes

### 4.1 Visão geral do fluxo

```
ENTRADA          EXECUÇÃO                           SAÍDA
─────────        ──────────────────────────────     ──────────
spec-FEAT.yaml → STAGE 1: Read & Plan            → plano.md
                 STAGE 2: Implement (addon code)
                 STAGE 3: Install & Upgrade       → install_log.json
                 STAGE 4: Validate API            → api_test_log.json
                 STAGE 5: Validate UI             → ui_test_log.json
                 STAGE 6: Document               → feature-FEAT.md
                 STAGE 7: Commit & PR            → Pull Request
```

### 4.2 Etapas em detalhe

#### STAGE 1 — Ler e planear

```
✓ Ler spec YAML completamente
✓ Identificar arquivos a criar/modificar (models, views, security, data)
✓ Listar dependências (módulos Odoo necessários)
✓ Listar riscos (campos inexistentes, módulos não instalados, etc.)
✓ Gerar plano com passos incrementais
```

#### STAGE 2 — Implementar

```
✓ Criar estrutura de diretórios do addon
✓ Implementar modelos Python (models/)
✓ Criar views XML (views/)
✓ Configurar segurança (security/security.xml + ir.model.access.csv)
✓ Adicionar dados iniciais se necessário (data/)
✓ Commits incrementais — nunca tudo de uma vez
```

**Estrutura obrigatória de um addon:**

```
addon/meu_addon/
├── __init__.py
├── __manifest__.py          # name, version, depends, data
├── models/
│   ├── __init__.py
│   └── meu_model.py         # CamelCase class, dot-notation _name
├── views/
│   ├── meu_model_views.xml  # form, tree, search
│   └── menus.xml
├── security/
│   ├── security.xml         # grupos de acesso
│   └── ir.model.access.csv  # matriz de permissões (obrigatória)
└── data/
    └── dados_iniciais.xml   # opcional
```

#### STAGE 3 — Instalar e fazer upgrade

```powershell
& .venv\Scripts\python.exe scripts\install_[addon].py
```

> ⚠️ **SaaS limitation:** Em Odoo SaaS (`marcorv.odoo.com`) não há acesso SSH nem shell. Modelos Python custom não podem ser instalados via import wizard. Documentar como limitação quando aplicável.

#### STAGE 4 — Validar API

```powershell
& .venv\Scripts\python.exe scripts\test_[addon]_api.py
```

Gates obrigatórios:
- `create` — criar registro via XML-RPC
- `read` — leitura dos campos definidos no spec
- `write` — edição de pelo menos um campo
- `search` — pesquisa por domínio
- `unlink` — eliminar registro de teste (cleanup)

#### STAGE 5 — Validar UI

```
✓ Login no Odoo via browser
✓ Navegar até ao novo menu
✓ Criar registro via UI
✓ Editar registro
✓ Verificar ausência de erros no console JavaScript (F12)
```

#### STAGE 6 — Documentar

Gerar `docs/features/feature-FEAT-XXXX.md` com:
- Resumo do que foi feito
- Decisões técnicas tomadas
- Evidências dos gates (logs)
- Limitações conhecidas

#### STAGE 7 — Commit & PR

```powershell
# Addon: commit no subrepositório
cd addon
git add .
git commit -m "feat: implementar [nome_addon]"
git push origin main

# Docs/Tasks: commit na raiz
cd ..
git add docs/ src/codoo/tasks/
git commit -m "docs: relatório feature FEAT-XXXX"
git push origin docs/feat-xxxx

# PR criado com título e descrição completos
```

### 4.3 Gates de validação obrigatórios

Nenhuma feature pode ser considerada completa sem passar **todos** os gates:

| Gate | Critério de Sucesso |
|---|---|
| ✅ Module Install | Sem erros críticos na instalação |
| ✅ Module Upgrade | Sem erros críticos no upgrade |
| ✅ API CRUD | Todos os testes de API passam |
| ✅ API Permissions | Grupos e ACL funcionam como especificado |
| ✅ UI Flow | Menu existe, registo pode ser criado e editado |
| ✅ No Critical JS Errors | Console sem erros críticos |
| ✅ Logs Generated | Todos os JSON de evidência existem |

### 4.4 Política de auto-correção

Se um gate falha:

1. Diagnosticar → ler mensagem de erro
2. Corrigir → modificar código/config
3. Retentar → executar o gate novamente
4. Repetir até passar (máximo 3 tentativas por gate)

Se após 3 tentativas continuar a falhar:
- Documentar a limitação com evidências
- Oferecer alternativa (workaround, outro módulo)
- Registar no relatório da feature

---

## 5. Prompt Inicial do Agente

O **prompt inicial** é o ponto de entrada obrigatório para qualquer agente ou developer que inicie uma sessão neste repositório.

### 5.1 O que faz

Ao ser executado, o prompt inicial instrui o agente a:

1. **Orientar-se no repositório** — ler AGENTS.md, CODOO.md, listar specs e tasks
2. **Identificar skills** — carregar os skills relevantes para a tarefa actual
3. **Verificar ferramentas** — Python, Git, venv, `.env`
4. **Testar conectividade** — executar teste de `authenticate()` via XML-RPC e interpretar resultado
5. **Validar UI** — verificar se Playwright está disponível
6. **Gerar diagnóstico** — relatório estruturado do estado do ambiente
7. **Operar em modo seguro** — propor próximo passo com guardrails activos

### 5.2 Como usar

**Opção A — Como prompt no VS Code Copilot:**

Escrever no chat:
```
/codoo-init
```
O prompt `.github/prompts/codoo-init.prompt.md` será carregado automaticamente.

**Opção B — Como instrução directa ao agente:**

Copiar e enviar o conteúdo de [`.github/prompts/codoo-init.prompt.md`](../../.github/prompts/codoo-init.prompt.md) para o chat do agente.

### 5.3 Output esperado

O agente deve devolver um diagnóstico no seguinte formato:

```
══════════════════════════════════════════════
  DIAGNÓSTICO CODOO — 2026-04-21 10:30
══════════════════════════════════════════════

AMBIENTE
  Python:          3.13.1
  Git:             2.44.0
  Virtualenv:      OK
  .env:            OK

CONECTIVIDADE ODOO
  Host:            https://marcorv.odoo.com
  Autenticação:    OK (uid=5)
  Módulos ativos:  project, mail, hr_timesheet, base

SKILLS DISPONÍVEIS
  odoo-19, code-review, brainstorming, dtg-base
  Relevantes para esta sessão: odoo-19, code-review

REPOSITÓRIO
  Branch atual:    docs/codoo-workflow
  Specs pendentes: spec-FEAT-0002.yaml
  Features prontas: 1
  Tasks:   codoo task list, codoo task run --mode inspect

MODO DE OPERAÇÃO
  ✅ SEGURO
  Próximo passo: Ler spec-FEAT-0002.yaml e propor plano

══════════════════════════════════════════════
```

### 5.4 Regras de segurança activas durante toda a sessão

| Regra | Comportamento |
|---|---|
| Nunca trabalhar em `main` | Criar sempre branch antes de qualquer alteração |
| Nunca commitar `.env` | Verificar `.gitignore` antes de `git add .` |
| Nunca alterar código sem spec | Perguntar ao utilizador se não existir spec |
| Sempre validar sintaxe | `python -m py_compile` antes de commitar |
| `git push --force` | Requer confirmação explícita do utilizador |
| Eliminar ficheiros | Requer confirmação explícita do utilizador |

---

## 6. Validação do Ambiente

### 6.1 Diagnóstico de conectividade

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
print("uid:", uid)
PY
```

Este teste valida autenticação XML-RPC sem depender de scripts legados.

### 6.2 O que validar em cada sessão

| Check | Método | Resultado esperado |
|---|---|---|
| Python disponível | `python --version` | `Python 3.13.x` |
| venv activo | Prompt com `(.venv)` | Prefixo visível |
| Odoo autenticado | `authenticate()` via XML-RPC | `uid` numérico (ou similar) |
| Módulos críticos | Output do script | `project`, `mail` OK |
| Branch correcta | `git branch` | Nunca `main` |
| Sem alterações não commitadas | `git status` | `working tree clean` |

### 6.3 Troubleshooting de conectividade

| Erro | Causa provável | Solução |
|---|---|---|
| `Access Denied` | Credenciais erradas em `.env` | Verificar espaços, aspas, valores |
| `Connection refused` | URL errada ou sem rede | Verificar `ODOO_HOST` e ping |
| `405 Method Not Allowed` | GET em `/xmlrpc/2/common` | Usar `authenticate()` — não GET |
| `ModuleNotFoundError` | xmlrpc não disponível | `python -c "import xmlrpc.client"` |
| `2FA error` | Password da conta, não app-specific | Gerar app-specific password no Odoo |

### 6.4 Validação de sintaxe Python antes de commitar

```powershell
# Validar um ficheiro
python -m py_compile addon\meu_addon\models\meu_model.py

# Validar todos os .py no addon
Get-ChildItem -Path addon\meu_addon -Recurse -Filter "*.py" | ForEach-Object {
    python -m py_compile $_.FullName
    if ($LASTEXITCODE -eq 0) { Write-Host "[OK] $($_.Name)" }
    else { Write-Host "[ERR] $($_.Name)" }
}
```

---

## 7. Workflow Diário

### 7.1 Início de sessão

```powershell
# 1. Navegar para o repositório
cd C:\Users\marce\Desktop\Workspace\Corvanis\Codoo

# 2. Atualizar código
git pull origin main
cd addon && git pull origin main && cd ..

# 3. Ativar ambiente
& .venv\Scripts\Activate.ps1

# 4. Verificar conectividade
python -c "import xmlrpc.client; print('xmlrpc: OK')"

# 5. Ver branches ativas
git branch -a | Select-String "docs\|feat"
```

### 7.2 Durante o desenvolvimento

**Regras de ouro:**

- Um spec YAML por feature — nunca misturar features
- Commits pequenos e atómicos — 1 commit = 1 alteração lógica
- Nunca trabalhar diretamente em `main`
- Validar antes de commitar — `python -m py_compile models/arquivo.py`
- Logs sempre em JSON — nunca só texto

**Fluxo por feature:**

```powershell
# 1. Criar branch
git checkout -b feat/FEAT-XXXX

# 2. Implementar em blocos
# (ver STAGE 1-7 acima)

# 3. Validar gates
# Execute via tasks CLI e registre evidências em docs/logs/

# 4. Commitar
git add .
git commit -m "feat: [descrição clara]"

# 5. Push e PR
git push origin feat/FEAT-XXXX
# Criar PR no GitHub com título e descrição completos
```

### 7.3 Fim de sessão

```powershell
# Verificar que não ficou nada por commitar
git status

# Se houver trabalho em progresso, fazer WIP commit
git add .
git commit -m "wip: [o que estava a fazer]"
git push origin [branch-atual]

# Documentar ponto de paragem em docs/session_notes.md (opcional)
```

### 7.4 Convenção de commits

| Prefixo | Quando usar | Exemplo |
|---|---|---|
| `feat:` | Novo addon ou funcionalidade | `feat: implementar módulo certificados` |
| `fix:` | Correção de bug | `fix: corrigir permissões de groups` |
| `docs:` | Documentação | `docs: adicionar relatório FEAT-0001` |
| `test:` | Testes | `test: adicionar testes API corvanis.certificate` |
| `chore:` | Build, configurações | `chore: atualizar .env.example` |
| `refactor:` | Refatoração sem mudança de comportamento | `refactor: extrair lógica de validação` |
| `wip:` | Trabalho em progresso (não para PRs) | `wip: modelos a meio` |

---

## 8. Boas Práticas

### 8.1 Segurança

| Prática | Porquê |
|---|---|
| `.env` nunca no Git | Credenciais expostas = conta comprometida |
| App-specific password com 2FA | Password principal não exposta em scripts |
| `git status` antes de `git add .` | Evitar commitar ficheiros sensíveis acidentalmente |
| Rever `git diff --cached` antes de commitar | Confirmar exactamente o que vai no commit |
| Nunca hardcodar credenciais em scripts | Scripts são versionados — credenciais não |

### 8.2 Qualidade de código

| Prática | Porquê |
|---|---|
| CamelCase para classes Python (`CorvanisProject`) | Convenção Odoo |
| `_name` em dot-notation (`corvanis.project`) | Registo interno do Odoo |
| Versão `19.0.X.Y.Z` no `__manifest__.py` | Compatibilidade com Odoo 19 |
| `models.Constraint` em vez de `_sql_constraints` | Odoo 19 — API nova obrigatória |
| ACL em `ir.model.access.csv` para cada modelo | Sem ACL = modelo inacessível via UI |
| Carregar skill `odoo-19` antes de escrever código | Evita usar APIs depreciadas |

### 8.3 Colaboração com IA

| Prática | Porquê |
|---|---|
| Sempre fornecer spec YAML ao agente | Contexto partilhado e determinístico |
| Executar `/codoo-init` no início de cada sessão | Agente orientado antes de trabalhar |
| Não pedir ao agente para "melhorar" sem âmbito definido | Evita alterações fora de escopo |
| Rever o código antes de aceitar | O agente pode gerar código correctamente mas com suposições erradas |
| Usar `code-review` skill antes de fechar PR | Validação independente da implementação |
| Commits pequenos e atómicos | Histórico legível, reverter fácil se necessário |

### 8.4 Gestão do repositório

| Prática | Porquê |
|---|---|
| Um branch por feature (`feat/FEAT-XXXX`) | Isolamento e PR limpo |
| Sincronizar `addon/` e raiz após cada feature | Dual-repo em sincronia |
| Logs JSON para cada gate de validação | Rastreabilidade e auditoria |
| PR com título e descrição completos | Revisor tem contexto sem precisar de perguntar |
| Não fazer merge sem todos os gates passarem | Qualidade garantida antes de main |

### 8.5 Quando NÃO usar o agente

O agente **não deve** tomar decisões autónomas em:

- Eliminar dados de produção
- Alterar permissões de utilizadores reais
- Fazer push para `main` directamente
- Instalar módulos não testados em produção
- Ignorar falhas em gates de validação e avançar na mesma

> Para estas situações, o agente deve parar, documentar o bloqueio e aguardar instrução explícita do utilizador.
