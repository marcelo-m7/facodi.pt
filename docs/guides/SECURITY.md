# SECURITY.md - Práticas de Segurança

---

## Resumo Executivo

Este repositório implementa práticas de segurança por **camadas de defesa**:

1. **Credenciais:** Nunca versionadas (`.env` em .gitignore)
2. **Código:** Code review obrigatória antes de merge
3. **Testes:** Validação antes de produção (gates automatizados)
4. **Dados:** Testes reversíveis, sem dados sensíveis em logs
5. **Acesso:** Git requer autenticação, SaaS requer credenciais específicas

---

## 1. Gestão de Credenciais

### 1.1 Arquivo `.env`

**Status:** ✅ Nunca commitado (em .gitignore)

**Conteúdo típico:**
```bash
ODOO_HOST=https://marcorv.odoo.com
ODOO_DB=marcorv-main-31133906
ODOO_USERNAME=seu_email@email.com
ODOO_PASSWORD=sua_senha_ou_app_password
```

**Regras:**

| Regra | Por quê | Como |
|---|---|---|
| Nunca citar `.env` em issues | Expõe credenciais | Use exemplos com `[VALUE]` |
| Nunca copiá-lo para PRs | Histórico Git permanente | Manter local apenas |
| Rotacionar periodicamente | Reduz risco se vazada | A cada 90 dias |
| Usar app-specific password se 2FA | Senha única e limitada | Gerar em Odoo Settings |
| Nunca debuggar com print() credencial | Logs ficam públicos | Usar `***` em logs |

**Exemplo de verificação de `.env` em script:**

```python
# ❌ ERRADO
print(f"Conectando com {username}:{password}")  # Expõe credencial!

# ✅ CORRETO
print(f"Conectando com {username}:***")  # Oculta credencial
```

### 1.2 App-Specific Password (Odoo 2FA)

Se sua conta Odoo tem 2FA ativado, use app-specific password:

**Como gerar:**
1. Login no Odoo como seu usuário
2. Clique no avatar (canto superior direito)
3. Settings > Security & Privacy > Two-factor authentication
4. "Generate App Password"
5. Cole o valor em `.env`

**Benefícios:**
- ✅ Senha não exibe sua senha pessoal
- ✅ Pode ser revogada sem trocar senha pessoal
- ✅ Escopo limitado a apenas XML-RPC
- ✅ Suporta expirações

### 1.3 Rotação de Credenciais

**Quando rotacionar:**
- 📅 A cada 90 dias (agenda)
- 🚨 Se suspeitar vazamento
- 🔄 Se trocar de device/trabalho
- 📤 Se fazer push acidental de `.env`

**Como rotacionar:**

1. Mudar senha Odoo (ou gerar novo app-specific password)
2. Atualizar `.env` local
3. Testar conectividade: `authenticate()` via XML-RPC
4. Se trabalha em equipe, comunicar a renovação

### 1.4 Segredos em Variáveis de Ambiente

Alternativa: usar variáveis de sistema em vez de arquivo:

```powershell
# Windows PowerShell
$env:ODOO_HOST = "https://marcorv.odoo.com"
$env:ODOO_DB = "marcorv-main-31133906"
$env:ODOO_USERNAME = "seu_email@email.com"
$env:ODOO_PASSWORD = "sua_senha"

# Script Python lê automaticamente
import os
username = os.environ.get('ODOO_USERNAME')
```

Mais seguro que arquivo físico em disco.

---

## 2. Segurança de Código

### 2.1 Code Review Obrigatória

**Política:** Nenhum código entra em `main` sem aprovação.

**Fluxo:**
```
Feature branch
    │
    └─ Abrir PR no GitHub
       │
       ├─ Automated checks (linting, syntax)
       ├─ Manual code review
       │  ├─ Verificar: credenciais versionadas?
       │  ├─ Verificar: SQL injection?
       │  ├─ Verificar: permissões adequadas?
       │  └─ Verificar: não toca em core Odoo?
       │
       ├─ Aprovação ✅
       │  │
       │  └─ Merge com --no-ff (preserva histórico)
       │
       └─ Rejeição ❌
          │
          └─ Feedback: fix, resubmit
```

**O que revisor verifica:**

| Aspecto | Checklist |
|---|---|
| **Credenciais** | Sem `.env`, sem senhas, sem tokens hardcoded |
| **SQL Injection** | Sem concatenação de strings SQL, usar `domain` Odoo |
| **Permissões** | ACL em addons é conservador (não + acesso que necessário) |
| **Código Odoo** | Não modifica core models (respeita extends) |
| **Código Python** | Sem imports maliciosos, sem execução de shell |
| **Dados** | Testes não persistem dados de teste, são reversíveis |
| **Conformidade** | Segue Conventional Commits, atualiza docs |

### 2.2 Evitar Práticas Inseguras

#### ❌ Nunca Fazer

**1. SQL Injection:**
```python
# ❌ INSEGURO
query = f"SELECT * FROM {model_name} WHERE name = '{input_user}'"

# ✅ SEGURO
records = models.execute_kw(db, uid, pwd, model_name, 'search', [['name', '=', input_user]])
```

**2. Credential Hardcoding:**
```python
# ❌ INSEGURO
user = "meu_email@email.com"
password = "minha_senha_123"

# ✅ SEGURO
user = os.environ.get('ODOO_USERNAME')
password = os.environ.get('ODOO_PASSWORD')
```

**3. Modificar Core Models:**
```python
# ❌ INSEGURO (monkey-patch)
from odoo.models import Model
Model.dangerous_method = lambda self: "hack"

# ✅ SEGURO
class MyModel(models.Model):
    _name = 'my.model'
    _inherit = 'base.model'  # Extend properly
    
    def safe_method(self):
        return "safe"
```

**4. Executar Commands Desconhecidos:**
```python
# ❌ INSEGURO
import subprocess
subprocess.run(f"python {user_input_script}")  # User-controlled!

# ✅ SEGURO
# Apenas run tasks/scripts versionados e revisados
subprocess.run(["python", "-m", "codoo", "task", "run", "--name", "<task-name>", "--mode", "inspect"])
```

**5. Versionando Dados Sensíveis:**
```python
# ❌ INSEGURO
# Commit de real customer IDs, emails, etc em logs
test_data = {
    'email': 'real_customer@company.com',
    'phone': '+55 11 98765-4321',
}

# ✅ SEGURO
test_data = {
    'email': 'test@example.com',
    'phone': '+55 11 99999-9999',  # Fake/generic
}
```

### 2.3 Linting e Validação Automática

**Scripts de validação:**

```powershell
# Validar syntax Python
python -m py_compile src/codoo/tasks/**/*.py
python -m py_compile addon/*/*.py

# Validar XML
# (Odoo XML parser integrado em scripts)

# Validar JSON dos logs
python -m json.tool docs/*_log.json

# Procurar por padrões inseguros
grep -r "password = " addon/  # Procurar hardcoded password
grep -r "ODOO_PASSWORD" src/  # Fora de .env
```

---

## 3. Segurança de Dados

### 3.1 Testes São Reversíveis

**Princípio:** Testes criam dados, depois deletam. Nada deve persistir.

**Exemplo:**
```python
# Create
created_id = models.execute_kw(db, uid, pwd, 'res.partner', 'create', [{
    'name': 'Test Partner',
    'email': 'test@example.com',
}])

# Verify
partner = models.execute_kw(db, uid, pwd, 'res.partner', 'read', [created_id])
assert partner[0]['name'] == 'Test Partner'

# Delete (cleanup)
models.execute_kw(db, uid, pwd, 'res.partner', 'unlink', [created_id])

# Verify deleted
found = models.execute_kw(db, uid, pwd, 'res.partner', 'search', [['id', '=', created_id]])
assert len(found) == 0  # Deve estar vazio
```

**Ordem é crítica:**
1. Create test data
2. Verify success
3. **Always delete** (mesmo se teste falha)
4. Verify deletion

### 3.2 Logs Não Contêm PII

**PII = Personally Identifiable Information:**
- Emails de clientes reais
- Telefones de clientes
- Nomes completos (salvo genéricos)
- Endereços reais
- Números de documentos

**Regra:** Logs JSON salvos em `docs/` devem usar dados de teste ou `[REDACTED]`.

**Bom exemplo:**
```json
{
  "test": "create_partner",
  "created": {
    "id": 123,
    "name": "Test Partner",
    "email": "test@example.com"
  }
}
```

**Mau exemplo ❌:**
```json
{
  "test": "create_customer",
  "created": {
    "id": 456,
    "name": "João da Silva",
    "email": "joao.silva@mycompany.com",
    "phone": "+55 11 98765-4321",
    "cpf": "123.456.789-00"
  }
}
```

### 3.3 Permissões de Acesso a Dados

**Quien acessa o quê:**

| Recurso | Quem acessa | Como | Restrição |
|---|---|---|---|
| `.env` | Developers | Arquivo local | Nunca commit |
| `docs/*_log.json` | Developers + CI | Git (versionado) | Sem PII |
| `addon/` | GitHub (público) | Repositório público | Sem código malicioso |
| Odoo Database | Desenvolvedor (uid=5) | XML-RPC + credenciais | Apenas dev/test |

**Controle de Acesso Odoo:**

Addons devem implementar ACL restritiva:

```xml
<!-- security.xml -->
<record id="group_deliverer" model="res.groups">
    <field name="name">Codoo User</field>
</record>

<!-- ir.model.access.csv -->
<!-- Model Name, Name, Group, Create, Read, Write, Delete -->
corvanis_project_user,Corvanis Project User,group_deliverer,1,1,1,0
<!-- User CAN create/read/write, BUT NOT delete -->
```

---

## 4. Segurança de Infraestrutura

### 4.1 Ambiente SaaS vs Self-Hosted

| Aspecto | SaaS (marcorv.odoo.com) | Self-Hosted |
|---|---|---|
| **Credenciais** | Usuário Odoo único | Múltiplos usuários possível |
| **Ambiente** | Produção compartilhada | Dev/Staging/Prod |
| **Addons Python** | ❌ Não permitido via ZIP import | ✅ Permitido via arquivo |
| **Banco de Dados** | Gerenciado por Odoo | Seu controle |
| **Backup** | Automático | Seu controle |
| **Patches** | Automático | Seu controle |

**Recomendação:** Para production features, usar self-hosted ou Odoo.sh, não SaaS.

### 4.2 Firewall e Network

**Acesso ao Odoo:**
- ✅ XML-RPC via HTTPS (encrypted)
- ✅ Autenticação username + password
- ✅ IP público (internet-facing)
- ⚠️ Sem IP whitelisting (SaaS não oferece)

**Recomendação:** 
- Rotacionar credenciais regularmente
- Usar app-specific password com 2FA
- Monitorar logs de acesso em Odoo

---

## 5. Segurança do Repositório Git

### 5.1 Branch Protection

**Política de `main`:**
```
main branch
├─ ✅ Requer code review (1+ aprovação)
├─ ✅ Requer testes passando
├─ ✅ Requer sync com upstream
├─ ❌ Force push não permitido
└─ ❌ Dismiss outdated reviews: disabled
```

**Como configurar (GitHub):**
1. Settings > Branches
2. Add rule para `main`
3. Require a pull request before merging ✅
4. Require code reviews ✅ (1 reviewer)
5. Dismiss stale pull request approvals ❌ (desmarcar)
6. Require status checks to pass ✅

### 5.2 Commits Assinados

**Opcional mas recomendado:** Sign commits com GPG

```powershell
# Gerar chave GPG
gpg --gen-key

# Configurar Git
git config --global user.signingkey [KEY_ID]
git config --global commit.gpgsign true

# Commit assinado
git commit -m "feat: nova feature" -S
```

**Vantagem:** Prova autenticidade do commit.

### 5.3 Secrets em GitHub

**Proteger segredos em GitHub Actions (futuro CI/CD):**

```yaml
name: Run Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Test connectivity
        env:
          ODOO_HOST: ${{ secrets.ODOO_HOST }}
          ODOO_DB: ${{ secrets.ODOO_DB }}
          ODOO_USERNAME: ${{ secrets.ODOO_USERNAME }}
          ODOO_PASSWORD: ${{ secrets.ODOO_PASSWORD }}
        run: python -c "import xmlrpc.client; print('xmlrpc: OK')"
```

**Como configurar:**
1. GitHub repo > Settings > Secrets and variables > Actions
2. New repository secret
3. Nome: `ODOO_PASSWORD`
4. Valor: sua app-specific password
5. Add secret ✅

Variáveis nunca aparecem em logs, apenas `***`.

---

## 6. Segurança de Documentação

### 6.1 O Que Documentar

**Seguro documentar:**
- ✅ Arquitetura e design
- ✅ Fluxos e protocolos
- ✅ Exemplos com dados fake
- ✅ Referências externas (links)
- ✅ Guias de segurança

**Nunca documentar:**
- ❌ Credenciais reais
- ❌ Tokens de acesso
- ❌ URLs com credenciais (ex: `https://user:pass@host`)
- ❌ Dados de clientes reais
- ❌ IDs internos de produção

### 6.2 Versionamento de Documentação

Todos os `.md` files devem ter:

```markdown
---
Versão: 1.0
Data: 21 de Abril de 2026
Status: Production
Revisado por: [Nome]
---
```

---

## 7. Checklist de Segurança

### Antes de Commitar

```
☐ Validar que NÃO tem .env commitado
☐ Verificar se há credenciais em comentários
☐ Verificar se há emails/telefones de cliente em dados
☐ Confirmar que testes são reversíveis (criam e deletam)
☐ Validar syntax Python: python -m py_compile
☐ Validar JSON dos logs
☐ Mensagem de commit é clara e não expõe detalhes
```

### Antes de Abrir PR

```
☐ Branch criado de `main` atualizado
☐ Commits incluem apenas mudanças relacionadas
☐ Nenhum arquivo de configuração pessoal (.vscode, .idea, etc)
☐ Descrição de PR explica o quê e por quê
☐ Links para logs JSON (sem PII)
☐ Se toca addons: ACL foi revisto e é conservador
☐ Se toca scripts: credenciais são de .env, não hardcoded
```

### Antes de Merge

```
☐ Todos os checks automáticos passam
☐ Code review foi aprovada
☐ Conflitos com main foram resolvidos
☐ Nenhum commit foi force-pushed
☐ Changelog foi atualizado (se feature significante)
```

---

## 8. Incidentes de Segurança

### 8.1 Se Vazou Credencial

**Ação imediata:**

1. **Rotacionar credencial** (senha ou app-specific password)
2. **Verificar Git history:**
   ```powershell
   git log --all --oneline | grep -i "password|secret|token"
   git log -p -S "ODOO_PASSWORD" --all  # Procurar commits com credencial
   ```
3. **Se encontrou, rewrite history:**
   ```powershell
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env' \
     --prune-empty --tag-name-filter cat -- --all
   ```
4. **Force push:**
   ```powershell
   git push --force-with-lease origin main
   ```
5. **Alertar time:** Credencial foi exposta, rotacionada.

### 8.2 Se Encontrou Código Malicioso

**Ação:**

1. Não merge PR
2. Comentar no PR com preocupação
3. Marcar como "Needs Review" para outro reviewer
4. Se confirmado malicioso: Close sem merge, reportar ao GitHub

---

## 9. Compliance e Auditoria

### 9.1 Audit Trail

Todos os acessos a Odoo via XML-RPC deixam logs em:
- Odoo Admin > Logging > Access Logs
- Mostram: usuário, modelo, operação (create/read/write/unlink), timestamp

Manter para:
- ✅ Diagnóstico de problemas
- ✅ Compliance
- ✅ Detecção de anomalias

### 9.2 Documentação de Decisões

Cada decisão de segurança deve ser documentada:

```markdown
**Decision:** Usar app-specific password em vez de senha Odoo

**Rationale:** Reduz risco se .env vazar; permite revogação sem mudar senha pessoal

**Date:** 21/04/2026

**Owner:** Corvanis Security Team

**Status:** Active
```

---

## 10. Escalação de Problemas de Segurança

**Se encontrar vulnerabilidade:**

1. **NÃO publique publicamente**
2. **Abra GitHub Issue privado (Security advisory):**
   - Settings > Security > Private vulnerability reporting
3. **Descreva:**
   - Tipo de vulnerabilidade (SQL injection, XXS, credential leak, etc)
   - Como reproduzir (passos específicos)
   - Impacto potencial
   - Sugestão de fix (se tiver)
4. **Aguarde resposta** (SLA: 24-48h)

---

## Referências

- [AGENTS.md](AGENTS.md) - Guia de segurança para agentes
- [CONTRIBUTING.md](CONTRIBUTING.md) - Code review recomendações
- [ARCHITECTURE.md](ARCHITECTURE.md) - Considerações de segurança
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Vulnerabilidades web comuns
- [Odoo Security Recommendations](https://www.odoo.com/documentation/19.0/developer/misc/security.html)

---

**Versão:** 1.0  
**Data:** 21 de Abril de 2026  
**Status:** Production  
**Revisado por:** Corvanis Development Team

**Última atualização:** Este documento  
**Próxima revisão:** 21 de Julho de 2026


