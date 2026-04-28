---
agent: agent
description: "Prompt inicial Codoo — avalia ambiente, identifica tools e skills, testa conectividade Odoo e gera diagnóstico completo antes de qualquer implementação. Use no início de cada sessão de desenvolvimento Odoo ou quando receber uma nova tarefa neste repositório."
---

# Prompt Inicial Codoo — Diagnóstico e Orientação do Agente

## Objectivo

Antes de iniciar qualquer implementação, este prompt faz com que o agente:

1. Avalie o estado do repositório
2. Identifique as ferramentas disponíveis
3. Identifique os skills relevantes
4. Teste a conectividade com o Odoo
5. Valide o ambiente local
6. Gere um diagnóstico estruturado
7. Proponha o próximo passo em modo seguro

---

## Instruções ao Agente

Segue as seguintes etapas na ordem indicada. Em cada etapa, reporta o resultado antes de prosseguir.

---

### ETAPA 1 — Orientação no repositório

1. Lê o ficheiro `AGENTS.md` na raiz do repositório
2. Lê `docs/guides/CODOO.md` para entender a metodologia
3. Lista os ficheiros em `docs/features/` para identificar specs e features existentes
4. Lista os ficheiros em `src/codoo/tasks/` para entender as automações disponíveis
5. Reporta:
   - Número de specs YAML existentes
   - Número de features já implementadas
  - Tasks disponíveis para inspeção e execução

---

### ETAPA 2 — Identificar skills disponíveis

1. Lista os diretórios em `.agents/skills/`
2. Para cada skill relevante à tarefa actual, lê o ficheiro `SKILL.md` correspondente
3. Identifica especialmente:
   - `odoo-19` → usar em qualquer trabalho de addon Odoo
   - `code-review` → usar antes de marcar qualquer tarefa como completa
   - `brainstorming` → usar antes de implementar features novas
4. Reporta quais skills estão disponíveis e quais são relevantes para a sessão actual

---

### ETAPA 3 — Verificar ferramentas de desenvolvimento

Verifica a disponibilidade das seguintes ferramentas no ambiente:

```bash
# Python
python --version

# Git
git --version

# Virtualenv (Linux/macOS/Windows)
test -f .venv/bin/activate || test -f .venv/Scripts/Activate.ps1

# xmlrpc (built-in Python)
python -c "import xmlrpc.client; print('xmlrpc: OK')"

# .env configurado
test -f .env

# CLI instalada
python -m codoo --help
```

Reporta o status de cada verificação (✅ OK / ❌ Falhou).

Se o `.venv` não existir:
```bash
python -m venv .venv
# Linux/macOS
source .venv/bin/activate
# Windows PowerShell
# .\.venv\Scripts\Activate.ps1
```

Se o `.env` não existir:
→ Notificar utilizador que é necessário criar `.env` com base em `.env.example`
→ **NÃO prosseguir** sem `.env` válido

---

### ETAPA 4 — Testar conectividade com o Odoo

Executa um teste de autenticação XML-RPC direto (sem expor segredos):

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

assert all([host, db, user, pwd]), "Missing required ODOO_* variables in .env"
common = xmlrpc.client.ServerProxy(f"{host}/xmlrpc/2/common")
uid = common.authenticate(db, user, pwd, {})
print("authenticate:", "OK" if uid else "FAILED")
PY
```

Valida no output:
- Autenticação XML-RPC bem-sucedida (`authenticate`) → conectividade confirmada
- Dados de ambiente sem exposição de segredos → ambiente válido
- Erros de conexão/autenticação → registar e analisar antes de avançar

Se a autenticação falhar:
1. Verificar `.env` (espaços, valores, aspas)
2. Se 2FA activo → lembrar utilizador de usar app-specific password
3. **Não avançar** para implementação sem conectividade validada

---

### ETAPA 5 — Validar UI (se disponível)

Se o Playwright estiver instalado, validar acesso básico ao Odoo:

```powershell
python -c "from playwright.sync_api import sync_playwright; print('playwright: OK')"
```

Se disponível:
- Abrir navegador em modo headless
- Verificar que `ODOO_HOST/web/login` carrega
- Reportar status

Se não disponível:
- Registar como limitação
- Testes UI manuais serão necessários

---

### ETAPA 6 — Gerar diagnóstico estruturado

Após as etapas anteriores, apresentar o seguinte diagnóstico:

```
══════════════════════════════════════════════
  DIAGNÓSTICO CODOO — [DATA/HORA]
══════════════════════════════════════════════

AMBIENTE
  Python:          [versão]
  Git:             [versão]
  Virtualenv:      [OK / Ausente]
  .env:            [OK / Ausente]

CONECTIVIDADE ODOO
  Host:            [ODOO_HOST]
  Autenticação:    [OK / FALHOU]
  Módulos ativos:  [lista]

SKILLS DISPONÍVEIS
  [lista de skills encontrados]
  Relevantes para esta sessão: [lista]

REPOSITÓRIO
  Branch atual:    [branch]
  Specs pendentes: [lista ou "nenhum"]
  Features prontas:[número]
  Tasks:           [lista]

MODO DE OPERAÇÃO
  [SEGURO / ATENÇÃO]
  [Próximo passo recomendado]

══════════════════════════════════════════════
```

---

### ETAPA 7 — App Lifecycle Check (quando a tarefa envolver apps)

Se a tarefa mencionar criação/evolução/rollback de app Studio, executar:

```bash
python -m codoo studio list-apps
```

Se o app alvo existir e estiver com `menu_id` vazio, `icon=False` ou `acl_count=0`:

```bash
python -m codoo studio repair-app --model <x_model>
```

Se a tarefa for rollback/desinstalação de app custom:

```bash
# dry-run obrigatório primeiro
python -m codoo studio delete-app --model <x_model>

# só depois aplicar com confirmação explícita
python -m codoo studio delete-app --model <x_model> --yes
```

Reportar o resultado e o ficheiro de evidência em `docs/logs/`.

---

### ETAPA 8 — Operar em modo seguro

Após o diagnóstico, propor o próximo passo seguindo estas regras:

**Regras de segurança:**
- ✅ Nunca alterar código sem spec YAML aprovado
- ✅ Nunca trabalhar diretamente em `main`
- ✅ Nunca commitar `.env` ou credenciais
- ✅ Sempre validar sintaxe Python antes de commitar: `python -m py_compile [ficheiro]`
- ✅ Sempre confirmar o branch correto antes de qualquer commit
- ✅ Sempre criar branch de feature antes de iniciar implementação
- ❌ Nunca fazer `git push --force` sem confirmação explícita do utilizador
- ❌ Nunca eliminar ficheiros sem confirmar com o utilizador

**Próximo passo:**

Se foi fornecido um spec YAML → confirmar leitura e propor plano de implementação seguindo `docs/guides/CODOO.md`

Se NÃO foi fornecido spec → perguntar ao utilizador qual é a tarefa e se existe spec em `docs/features/`

---

### ETAPA 9 — Higiene de contexto e limites do repositório

Antes de implementar alterações, confirmar os limites de edição:

- `docs/odoo/**` e `docs/documentation/**` são espelhos/documentação externa; evitar alterações salvo pedido explícito
- Alterações de implementação Odoo vivem no próprio repositório (single-repo), principalmente em `src/codoo/` e áreas de frontend/docs conforme o escopo.
- Automações operacionais vivem em `src/codoo/tasks/`; evidências em `docs/logs/`

Reportar explicitamente se a tarefa atual parece exigir edição fora destes limites.

---

## Output esperado deste prompt

Ao concluir, o agente deve ter:

- [ ] Lido AGENTS.md e CODOO.md
- [ ] Identificado skills relevantes
- [ ] Validado Python, Git e .venv
- [ ] Confirmado que .env existe
- [ ] Testado conectividade Odoo (ou documentado falha)
- [ ] Verificado disponibilidade do Playwright
- [ ] Apresentado diagnóstico estruturado
- [ ] Proposto próximo passo em modo seguro
- [ ] (Se aplicável) Executado app lifecycle check (`studio list-apps` / `repair-app` / `delete-app dry-run`)
