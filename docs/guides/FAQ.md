# FAQ.md - Perguntas Frequentes

---

## Perguntas Gerais

### P: O que é este repositório?

**R:** `Corvanis/Codoo` é um workspace de orquestração para desenvolvimento Odoo incremental. Ele conecta especificações de features (YAML), tasks de automação (Python), documentação, e um repositório de addons separado (`Corvanis/marcor`). Permite que agentes (LLMs) trabalhem autonomamente com entrada determinística e saída rastreável.

**Refs:** [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md)

### P: Qual é a relação entre Codoo e marcor?

**R:** 
- **Codoo** (raiz): Orquestração, scripts, specs, documentação
- **Marcor** (em `addon/`): Implementação, addons Odoo

São dois repositórios Git, com marcor montado como subdiretório em Codoo. Mudanças em addons → commit em `addon/`. Mudanças em scripts/docs → commit na raiz.

**Refs:** [ARCHITECTURE.md - Camadas](ARCHITECTURE.md#1-camadas-arquiteturais)

### P: Como faço para começar?

**R:** 
1. Leia [AGENTS.md - Seção 2](AGENTS.md#2-preparação-inicial) (Setup)
2. Execute um teste `authenticate()` via XML-RPC para validar conectividade
3. Receba uma spec YAML ou crie uma usando `spec-template.yaml`
4. Siga [CONTRIBUTING.md](CONTRIBUTING.md) para entender os 8 stages

### P: Preciso de permissões especiais?

**R:** 
- Para commitar: Acesso ao repositório Corvanis (você têm)
- Para instalar addons: Usuário Odoo com acesso admin (uid=5 no `.env`)
- Para fazer push: SSH key ou token GitHub configurado

### P: Este repositório é público?

**R:** Sim, em `Corvanis/Codoo` e `Corvanis/marcor`. Nunca commite credenciais em `.env` (está em .gitignore).

---

## Configuração e Ambiente

### P: O que fazer se `.env` está com erro?

**R:**
1. Abra `.env.example` como referência
2. Verifique cada linha:
   - `ODOO_HOST`: URL completa (ex: `https://marcorv.odoo.com`)
   - `ODOO_DB`: Banco exato (ex: `marcorv-main-31133906`)
   - `ODOO_USERNAME`: Email de login
   - `ODOO_PASSWORD`: Senha ou app-specific password
3. Sem espaços em branco antes/depois de `=`
4. Se usar app-specific password, ative 2FA em Odoo e gere uma

**Refs:** [AGENTS.md - 2.3](AGENTS.md#23-configurar-arquivo-env)

### P: Virtualenv está corrompido, como refazer?

**R:**
```powershell
Remove-Item -Recurse .venv
python -m venv .venv
& .venv\Scripts\Activate.ps1
pip install --upgrade pip
```

Sem packages extras necessários pois xmlrpc vem com Python 3.13+.

### P: Como verificar se conectividade está OK?

**R:**
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

Saída esperada:
```
authenticate: OK
```

Se falhar, verifique `.env` e rede.

---

## Features e Implementação

### P: O que é uma "feature spec"?

**R:** Um arquivo YAML (`docs/features/spec-FEAT-[ID].yaml`) que descreve completamente uma feature antes da implementação. Contém:
- Nome e ID único
- Modelos Odoo (fields, tipo, required)
- Views (form, tree, kanban)
- Segurança (grupos, ACL)
- Dependências (outros módulos)
- Testes necessários (API, UI)

**Ref:** [spec-template.yaml](docs/features/spec-template.yaml)

### P: Já existe uma spec para minha feature?

**R:** Cheque `docs/features/` por arquivo `spec-FEAT-*.yaml`. Se não encontrar, use `spec-template.yaml` como modelo.

### P: Qual é o protocolo de execução?

**R:** 7 stages obrigatórios:
1. **Read & Plan** - Ler spec, listar impactos
2. **Implement** - Código Odoo (modelo, views, security)
3. **Install & Upgrade** - Executar instalação remota
4. **API Validation** - CRUD tests
5. **UI Validation** - Navegação e criação de registros
6. **Documentation** - Escrever relatório
7. **Commit & Push** - Git e GitHub PR

**Ref:** [CONTRIBUTING.md](CONTRIBUTING.md) para protocolo de 8 stages

### P: E se um stage falha?

**R:** Aplicar auto-correction:
1. Ler mensagem de erro no log
2. Corrigir código/config
3. Rerun o mesmo stage
4. Se passar 3+ tentativas, documentar como limitação conhecida

**Ref:** [CONTRIBUTING.md - Validation Gates](CONTRIBUTING.md#workflow-de-contribuição)

### P: Como estruturo um addon?

**R:**
```
addon/meu_addon/
├── __init__.py
├── __manifest__.py       # Versão: 19.0.1.0.0
├── models/
│   ├── __init__.py
│   └── meu_model.py      # Class Model
├── views/
│   └── views.xml         # Form, Tree, Search
├── security/
│   ├── security.xml      # Grupos
│   └── ir.model.access.csv  # ACL
├── data/
│   └── initial_data.xml  # Dados iniciais (opcional)
└── README.md
```

**Refs:** [AGENTS.md - 5.2](AGENTS.md#52-estrutura-típica-de-um-addon-odoo), [addon/README.md](addon/README.md)

### P: Onde estão os templates?

**R:**
- **Spec:** `docs/features/spec-template.yaml`
- **Feature Report:** `docs/features/feature-template.md`
- **Addon Structure:** `addon/codoo/` (exemplo real)

---

## Testes e Validação

### P: Como testar um addon em API?

**R:**
1. Criar task de validação em `src/codoo/tasks/<dominio>/`
2. Conectar via XML-RPC
3. Executar CRUD:
   ```python
   # Create
   id = models.execute_kw(db, uid, pwd, 'meu.model', 'create', [{...}])
   # Read
   records = models.execute_kw(db, uid, pwd, 'meu.model', 'read', [id])
   # Write
   models.execute_kw(db, uid, pwd, 'meu.model', 'write', [id], {...})
   # Search
   found = models.execute_kw(db, uid, pwd, 'meu.model', 'search', [[...]])
   # Delete
   models.execute_kw(db, uid, pwd, 'meu.model', 'unlink', [id])
   ```
4. Salvar resultados em JSON: `docs/[addon]_api_test_log.json`

**Refs:** [CONTRIBUTING.md - Testes](CONTRIBUTING.md#validação-de-qualidade), exemplos em `src/codoo/tasks/`

### P: Como testar UI?

**R:**
1. Usar Playwright (Python)
2. Abrir navegador e fazer login
3. Navegar menus
4. Criar registros
5. Verificar console por JS errors

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('https://marcorv.odoo.com/web/login')
    # ... seu flow aqui ...
    browser.close()
```

**Refs:** [AGENTS.md - 6.2](AGENTS.md#62-testes-de-ui)

### P: Onde ficam os logs?

**R:** Em `docs/` com padrão `[feature/addon]_[tipo]_log.json`:
- `docs/codoo_install_log.json` - Install/upgrade
- `docs/codoo_api_test_log.json` - CRUD tests
- `docs/codoo_ui_test_log.json` - Browser tests

Formato JSON com estrutura:
```json
{
  "timestamp": "2026-04-21T10:30:00Z",
  "status": "SUCCESS|FAILED",
  "tests": { "test_name": { "passed": true, "result": "..." } },
  "errors": []
}
```

---

## Git e Versionamento

### P: Como fazer commit?

**R:** Use Conventional Commits:
```
feat(addon_name): implementar modelo principal
fix(scripts): corrigir erro de permissão
docs(AGENTS): adicionar seção de troubleshooting
test: adicionar validação de API
chore: atualizar .env.example
```

**Ref:** [CONTRIBUTING.md - Convenção de Commits](CONTRIBUTING.md#convenção-de-commits)

### P: Faço commits em qual branch?

**R:**
- Para feature: crie `feat/FEAT-[ID]-nome`
- Para bug: crie `fix/nome`
- Para docs: crie `docs/nome`
- Após pronto, abra PR para `main`

```powershell
git checkout -b feat/FEAT-0001-novo-addon
# ... trabalho ...
git push origin feat/FEAT-0001-novo-addon
# Ir ao GitHub e abrir PR
```

### P: Preciso fazer commit em dois lugares?

**R:** Sim, se mudança toca ambos repos:
- Addon mudou → commit em `addon/` e push para `Corvanis/marcor`
- Docs mudaram → commit na raiz e push para `Corvanis/Codoo`

Exemplo:
```powershell
# Raiz
git add docs/features/feature-FEAT-0001.md
git commit -m "docs: adicionar relatório de FEAT-0001"
git push origin feat/FEAT-0001-novo-addon

# Addon
cd addon
git add corvanis_certificates/
git commit -m "feat(corvanis_certificates): implementar modelo principal"
git push origin feat/FEAT-0001-novo-addon
cd ..
```

### P: Como faço força push segura?

**R:** Apenas force push em seu branch pessoal, nunca em `main`:

```powershell
# OK: force push seu branch
git push --force-with-lease origin feat/[seu-branch]

# ❌ NUNCA faça isso
git push --force-with-lease origin main
```

### P: Qual versão de addon usar?

**R:** Semver: `[Odoo].[Major].[Minor].[Patch]`
- `19.0.1.0.0` - Addon v1.0.0 para Odoo 19.0
- `19.0.1.0.1` - Addon v1.0.1 (bugfix)
- `19.0.1.1.0` - Addon v1.1.0 (feature nova)
- `19.0.2.0.0` - Addon v2.0.0 (breaking change)

Em `__manifest__.py`: `'version': '19.0.1.0.0'`

---

## Troubleshooting

### P: "ModuleNotFoundError: No module named 'xmlrpc'"

**R:** xmlrpc vem com Python. Tente:
```powershell
python -c "import xmlrpc.client; print('OK')"
```

Se falhar, reinstale Python 3.13 com checkbox "Add Python to PATH".

### P: "Access Denied" ao autenticar

**R:** Credenciais erradas. Verifique:
1. Email correto (case-sensitive)
2. Senha correta (ou app-specific se 2FA)
3. Sem espaços em branco no `.env`
4. Tente copiar/colar senha direto de Odoo Settings

### P: "Module is not installed"

**R:** Addon não instalou ou está em estado quebrado:
```powershell
# Verificar syntax
python -m py_compile addon/meu_addon/models/meu_model.py

# Tentar reinstalar
# Executar task existente em modo apply/verify ou criar task específica em src/codoo/tasks/

# Checar log
Get-Content docs/meu_addon_install_log.json | ConvertFrom-Json
```

### P: "Invalid field 'X' em modelo 'Y'"

**R:** Campo não existe naquele modelo. Descobrir campos reais:
```python
fields = models.execute_kw(db, uid, pwd, 'res.groups', 'fields_get', [])
print(list(fields.keys()))  # Ver todos os campos disponíveis
```

### P: Feature implementada mas UI não mostra

**R:** Verifique:
1. Menu foi definido em `views/menus.xml`?
2. Action foi criada?
3. Instalação foi bem-sucedida (cheque log)?
4. Permissões: usuário pertence ao grupo necessário?

Tente refresh no navegador: `Ctrl+Shift+R` (hard refresh)

### P: Qual é a senha correta?

**R:** Não usamos senha diretamente em `.env`. Use uma destas:
1. Senha Odoo normal (se 2FA desativado)
2. App-specific password (se 2FA ativado)
   - Em Odoo: Settings > Security > Generate App Password
   - Cole no `.env` como `ODOO_PASSWORD`

**Nunca** compartilhe senha em PR/commit.

---

## Features e Módulos Específicos

### P: Qual é o status do codoo?

**R:** 
- ✅ Código implementado e testado localmente
- ❌ Instalação em SaaS falha (limitação Odoo - modelo XML ID não resolve)
- 🔄 Pronto para instalar em Odoo self-hosted ou Odoo.sh

**Ref:** [docs/addons/codoo.md](docs/addons/codoo.md)

### P: Como está o Project Management System?

**R:**
- ✅ Implementado usando módulo `project` existente
- ✅ Projeto "Corvanis PMO" criado (id=3)
- ✅ 6 estágios operacionais configurados
- ✅ 3 tarefas iniciais criadas
- ✅ API CRUD validado
- ✅ UI navegável e funcional

**Ref:** [docs/features/feature-project-management-system.md](docs/features/feature-project-management-system.md)

---

## Escalação e Suporte

### P: Como relato um problema?

**R:** Abra uma GitHub Issue em `Corvanis/Codoo`:
- Título: [BUG] ou [QUESTION] - descrição curta
- Descrição: contexto, passos para reproduzir, erro esperado vs real
- Logs: anexe JSON logs se aplicável
- Ambiente: qual script executou, qual output obteve

### P: Preciso de ajuda? Como escalo?

**R:** 
1. Leia [TROUBLESHOOTING.md](TROUBLESHOOTING.md) (seções relevantes)
2. Consulte [FAQ.md](FAQ.md) (este arquivo)
3. Leia [AGENTS.md](AGENTS.md) seção relevante
4. Se ainda não resolveu, abra GitHub Issue com detalhes

### P: Há um documento que não entendo?

**R:** Todos os documentos têm referências cruzadas. Verifique:
- Topo de cada arquivo: **Versão**, **Data**, **Refs**
- Rodapé: links para documentos relacionados
- Seções transversais em [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Roadmap e Futuro

### P: Qual é o plano futuro?

**R:** Veja [ARCHITECTURE.md - Roadmap](ARCHITECTURE.md#7-roadmap-e-evoluções-futuras):
- **Curto prazo:** Specs e protocolos consolidados
- **Médio prazo:** CI/CD pipeline e database de features
- **Longo prazo:** Dashboard e multi-ambiente

### P: Posso contribuir com uma feature?

**R:** Sim! Siga [CONTRIBUTING.md](CONTRIBUTING.md):
1. Crie spec YAML usando `spec-template.yaml`
2. Implemente seguindo `CONTRIBUTING.md` (8 stages obrigatórios)
3. Abra PR com logs e relatório
4. Aguarde code review

---

## Índice Rápido

| Preciso... | Vou a... |
|---|---|
| ...começar | [AGENTS.md](AGENTS.md) Seção 2 |
| ...entender arquitetura | [ARCHITECTURE.md](ARCHITECTURE.md) |
| ...contribuir | [CONTRIBUTING.md](CONTRIBUTING.md) |
| ...resolver um problema | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| ...definir uma feature | [spec-template.yaml](docs/features/spec-template.yaml) |
| ...executar uma feature | [CONTRIBUTING.md](CONTRIBUTING.md) |
| ...relatar um addon | [feature-template.md](docs/features/feature-template.md) |
| ...entender segurança | [SECURITY.md](SECURITY.md) |
| ...manter scripts | [MAINTENANCE.md](MAINTENANCE.md) |
| ...saber o histórico | [CHANGELOG.md](CHANGELOG.md) |

---

**Versão:** 1.0  
**Data:** 21 de Abril de 2026  
**Última atualização:** Este documento  
**Mantido por:** Corvanis Development Team

**Tem uma pergunta que não está aqui?** Abra um GitHub Issue ou edite este arquivo com sua resposta!


