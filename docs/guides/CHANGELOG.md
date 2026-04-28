# CHANGELOG.md - Histórico de Mudanças

Todas as mudanças significativas neste projeto estão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) e este projeto adhere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.2] - 28 de Abril de 2026

### Mudado (Frontend + Planejamento Operacional)

#### Frontend Catalog UX
- Corrigido estado de carregamento do catalogo para evitar falso vazio na tela de cursos.
- Fluxo atualizado para exibir mensagem de carregamento antes do estado sem cursos.
- Build frontend validada sem regressao apos ajuste de loading state.

#### Integracao Odoo e Fallback
- Consolidado comportamento de fallback para dados mock quando Odoo SaaS retorna erro de sessao.
- Mantida fonte de verdade em Odoo para dados live; fallback continua ativo para resiliencia da UI.

#### Planejamento de Entrega do Dia
- Definido plano completo por fases para execucao hoje:
  - atualizacao documental
  - planejamento de features
  - execucao UC 19411008
  - consolidacao com evidencias
- Estrategia de enriquecimento da UC "Analise Matematica II" (19411008) com videos de playlist curada da Monynha Fun documentada para publicacao no Odoo.

#### Decisao Tecnica Supabase x Odoo
- Registrado que `mcp_supabase_apply_migration` nao grava no Odoo.
- Fluxo aprovado: Supabase/Monynha Fun como origem de leitura, publicacao final no Odoo via script Python (XML-RPC) com evidencias em `docs/logs/`.

### Resultado
- Documentacao alinhada com estado real da implementacao.
- Roadmap de hoje definido com tarefas executaveis e criterios de pronto.
- Trilha tecnica da UC 19411008 pronta para execucao auditavel.

---

## [1.0.1] - 27 de Abril de 2026

### Mudado (Documentation Refactoring)

#### Arquitetura Atualizada
- Refatoração completa de documentação para refletir nova arquitetura task-based
- `workspace/scripts/` → `src/codoo/tasks/` (operações em padrão CLI via Typer)
- `workspace/core/` → removido (artefato arquitetônico)
- Scripts legacy removidos; padrões inline preferidos (XML-RPC authenticate)

#### Documentação Principal (8 arquivos)
- **README.md** - Condensado de 580 → 140 linhas; added task CLI examples com modos (inspect/dry-run/apply/verify)
- **AGENTS.md** - Adicionado Section 7 (Studio App Lifecycle: create-app, list-apps, repair-app, delete-app); adicionado cross-platform bash exemplos
- **docs/guides/CODOO.md** - 9 replacements: `inspect_odoo_models.py` → inline Python XML-RPC authenticate(); `remote_config_apply.py` → `python -m codoo task run`
- **docs/guides/CONTRIBUTING.md** - Atualizado Section 4 (task convention `src/codoo/tasks/<domain>/<task>.py`); gate validation exemplos → task CLI
- **docs/guides/FAQ.md** - Conectividade check: notebook → inline XML-RPC authenticate()
- **docs/guides/SECURITY.md** - Rotação checks e CI/CD exemplos: script paths → src/codoo/tasks
- **docs/guides/INDEX.md** - Simplificado de 350 → 60 linhas; link-focused navigation
- **docs/guides/website-slides-extension-patterns.md** - Single line: workspace/scripts/ → src/codoo/tasks/

#### Skills Atualizadas
- **.agents/skills/codoo-methodology/SKILL.md** - Line 35: impacted zones `addon/, src/codoo/tasks/, workspace/data/`

#### CI/CD Workflows
- **.github/workflows/continuous-integration.yml** - Removido `workspace/core` + `workspace/scripts` compilation; adicionado `python -m codoo task list` validation
- **.github/workflows/odoo-integration-smoke.yml** - Removido `src/codoo/scripts/shared/python/inspect_odoo_models.py`; adicionado inline XML-RPC authenticate check (portable)

#### Prompts
- **.github/prompts/codoo-init.prompt.md** - Atualizado cross-platform shell commands (bash + PowerShell)

### Resultado
- 50+ referências stale a paths legacy removidas ou corrigidas
- Documentação agora reflete operações reais (task-based CLI)
- Padrões portáveis (XML-RPC checks sem dependências externas)
- Exemplos shell cross-platform (Linux/macOS/Windows)

---

## [1.0.0] - 21 de Abril de 2026

### Adicionado

#### Documentação Principal
- **AGENTS.md** - Guia completo para agentes (sem histórico de conversa) entenderem o repositório
  - Seções: Setup, estrutura, fluxo de features, testes, Git, troubleshooting, referências
  - Checklist de inicialização para novos agentes
  
- **ARCHITECTURE.md** - Arquitetura do sistema com diagramas
  - 3 camadas: Orquestração (Codoo), Implementação (Marcor), Execução (Odoo)
  - Fluxo de dados end-to-end
  - Componentes principais e políticas de versionamento
  - Roadmap futuro (CI/CD, dashboard, multi-ambiente)

- **CONTRIBUTING.md** - Guia de contribuição e workflow
  - Tipos de contribuições (features, bugfixes, docs, scripts, skills)
  - Convenção de commits (Conventional Commits)
  - Workflow de branches
  - Checklist de PR
  - Validação de qualidade
  - Sincronização entre repos

- **SECURITY.md** - Práticas de segurança em camadas
  - Gestão de credenciais (`.env`, app-specific password, rotação)
  - Segurança de código (code review, práticas inseguras, linting)
  - Segurança de dados (testes reversíveis, sem PII em logs)
  - Segurança de infraestrutura (SaaS vs self-hosted)
  - Branch protection e secrets em GitHub
  - Incidentes de segurança e escalação

- **FAQ.md** - Perguntas frequentes (70+ perguntas respondidas)
  - Gerais (propósito, relação Codoo/Marcor, início)
  - Configuração e ambiente
  - Features e implementação
  - Testes e validação
  - Git e versionamento
  - Troubleshooting comum
  - Escalação e suporte

#### Melhorias em Documentação Existente
- **README.md** - Revisão rápida (mantida concisa, user-facing)
- **AGENTS.md** (novo) - Substitui necessidade de onboarding manual
- **addon/README.md** - Referência mantida atualizada com estrutura padrão

#### Especificações e Protocolos (já existentes, consolidados)
- **docs/features/spec-template.yaml** - Template YAML para features
- **docs/guides/CONTRIBUTING.md** - 8 stages obrigatórios
- **docs/features/feature-template.md** - Template para relatórios

#### Scripts de Automação (operacionais)
- **workspace/scripts/odoo_environment_analysis.ipynb** - Diagnóstico geral
- **workspace/scripts/remote_config_apply.py** - Aplicação de configuração remota
- **src/codoo/scripts/shared/python/test_corvanis_delivery_hub_api.py** - Validação addon Corvanis
- **src/codoo/scripts/shared/python/implement_corvanis_project_system.py** - Configuração do Project
- **src/codoo/scripts/shared/python/test_project_system_api.py** - Validação do Project
- **src/codoo/scripts/shared/python/assess_project_instance.py** - Diagnóstico de estado

#### Features Implementadas
- **Project Management System** (feature-project-management-system.md)
  - Projeto "Corvanis PMO" criado (id=3)
  - 6 estágios operacionais configurados
  - 3 tarefas iniciais criadas
  - API CRUD validado (5/5 gates passando)
  - UI navegável e funcional
  - Documentação completa com logs

- **Corvanis Codoo** (codoo addon)
  - Modelo base `codoo.project` com fields
  - Security groups (admin, user)
  - Views (form, tree, search)
  - ACL matriz
  - Instalação em SaaS: ❌ (limitação Odoo)
  - Pronto para self-hosted: ✅

#### Estrutura e Configuração
- **.env.example** - Modelo de variáveis de ambiente
- **.gitignore** - Proteção de `.env`, `__pycache__`, `.venv`
- **skills-lock.json** - Lock de skills locais

#### Logs de Evidência
- **docs/api_analysis.json** - Análise de API raw
- **docs/project_system_implementation_log.json** - Log de implementação
- **docs/project_system_api_test_log.json** - Log de testes API
- **docs/codoo_install_log.json** - Log de instalação
- **docs/codoo_api_test_log.json** - Log de testes

#### Diagnósticos e Relatórios
- **docs/environment.md** - Perfil técnico da instância
- **docs/final-report.md** - Relatório final de bootstrap
- **docs/api-tests.md** - Resultados de testes API
- **docs/ui-tests.md** - Resultados de testes UI
- **docs/risks.md** - Riscos identificados
- **docs/odoo_environment_analysis.ipynb** - Notebook Jupyter (análise)

### Mudado

#### Melhorias em Protocolos Existentes
- **CONTRIBUTING.md** - Mantido estável, com 8 stages bem documentados
- **spec-template.yaml** - Consolidado com exemplos melhores

#### Reorganização de Documentos
- Todos os docs principais (`*.md`) organizados na raiz
- Feature-specific docs em `docs/features/`
- Logs e relatórios em `docs/` com padrão `[feature]_[tipo]_log.json`

### Corrigido

- **Problema:** res.groups field incompatibility em Odoo 19 SaaS
  - Solução: Auto-detection de field name (`users` vs `user_ids`)
  - Implementado em: implement_corvanis_project_system.py
  
- **Problema:** Addon installation em SaaS (model XML ID não resolve)
  - Status: Documentado como limitação conhecida
  - Workaround: Usar Odoo Studio ou self-hosted

### Removido

- N/A (primeira versão 1.0.0)

### Segurança

- ✅ `.env` protegido em .gitignore
- ✅ Testes reversíveis (sem dados persistem)
- ✅ App-specific password recomendado
- ✅ Code review obrigatória antes de merge
- ✅ Sem PII em logs JSON
- ✅ Credenciais sempre de variáveis, nunca hardcoded

### Deprecado

- N/A

### Planejado

#### Próximas Features (Backlog)
- FEAT-0001: Módulo de Certificados (addon pronto, awaiting install)
- FEAT-0002: Relatórios de Horas Timesheets
- FEAT-0003: Integração com SePay (pagamentos)
- FEAT-0004: Dashboard de KPIs

#### Infraestrutura Futura (Roadmap)
- **Curto (1-2m):** Self-hosted Odoo ou Odoo.sh para testes de installação
- **Médio (3-6m):** CI/CD pipeline (GitHub Actions), database de features
- **Longo (6+m):** Dashboard UI, multi-ambiente, feature rollback

---

## Notas de Lançamento

### Versão 1.0.0 Summary

Primeira versão estável do workspace marcelo-m7/facodi com:

✅ **Documentação Completa:**
- Guia para agentes (AGENTS.md)
- Arquitetura visual (ARCHITECTURE.md)
- Workflow de contribuição (CONTRIBUTING.md)
- Práticas de segurança (SECURITY.md)
- 70+ FAQs respondidas (FAQ.md)

✅ **Features Operacionais:**
- Project Management System (completo, validado)
- Corvanis Codoo (pronto, awaiting installation)

✅ **Infraestrutura:**
- 6 scripts de automação
- Protocolo de execução documentado
- Template YAML para specs
- Dual-repo architecture (Codoo + Marcor)

✅ **Qualidade:**
- Multi-gate validation (install, API, UI, permissions)
- Logs JSON para rastreabilidade
- Code review before merge
- 100% credenciais protegidas

⚠️ **Limitações Conhecidas:**
- Addon Python não instala em Odoo SaaS (limitação Odoo)
- Workaround: Odoo Studio ou self-hosted

### Como Upgrade

Se você já estava trabalhando neste repositório:

```powershell
# Puxar novos docs
git pull origin main

# Ler nuevos guias
Start-Process AGENTS.md  # Opens in VS Code
Start-Process ARCHITECTURE.md

# Recomendado: Review SECURITY.md para practices
# Recomendado: Consultar FAQ.md se tiver dúvidas
```

### Como Começar (Novo User/Agent)

1. **Leia:** [AGENTS.md](AGENTS.md) (seção 2, Setup)
2. **Setup:** Ativar `.venv` e testar conectividade
3. **Entenda:** [ARCHITECTURE.md](ARCHITECTURE.md) (camadas e fluxo)
4. **Receba spec:** Aguarde `docs/features/spec-FEAT-[ID].yaml`
5. **Implemente:** Siga [CONTRIBUTING.md](CONTRIBUTING.md) para os 8 stages de execução

---

## Histórico de Versão

| Versão | Data | Status | Principais |
|---|---|---|---|
| **1.0.0** | 2026-04-21 | ✅ Stable | Documentação completa, Project System operacional |
| 0.x | 2026-03-xx | 🔄 Dev | Bootstrap, addon scaffold, environment validation |

---

## Próximas Versões

### [1.1.0] - Planejado para Maio 2026

**Features:**
- Corvanis Certificates addon (install + validate)
- Timesheets integration (report)
- Documentation updates

**Infraestrutura:**
- Self-hosted Odoo.sh setup
- CI/CD pipeline (GitHub Actions)
- Automated install/test runs

### [2.0.0] - Planejado para Julho 2026

**Breaking Changes:**
- Migrate from XML-RPC to JSON-RPC (if major Odoo update)
- New feature database schema

**Features:**
- Dashboard UI
- Multi-environment support
- Feature rollback

---

## Como Reportar Issues

Encontrou um bug? Abra um GitHub Issue:

1. **Title:** `[BUG] - descrição curta`
2. **Labels:** `bug`, `critical` (se bloqueador), versão afetada
3. **Descrição:**
   - O que esperava vs o que aconteceu
   - Passos para reproduzir
   - Ambiente (Windows, Python 3.13, etc)
   - Logs relevantes (JSON)

## Como Contribuir com Features

Tem uma idea nova? Abra um GitHub Discussion ou Issue:

1. **Title:** `[FEATURE] - descrição`
2. **Descrição:** Proposta, benefícios, complexidade estimada
3. **Próximo passo:** Criaremos spec YAML

---

## Autores e Colaboradores

- **Project Lead:** Corvanis Development Team
- **Initial Setup:** Codoo Agent (Autonomous Agent)
- **Documentation:** Collective effort

## Licença

[LICENSE.md](LICENSE.md) (se existir)

---

**Mantido por:** Corvanis Development Team  
**Última atualização:** 21 de Abril de 2026  
**Próxima revisão:** 21 de Maio de 2026

---

## Convenções de Changelog

Versões seguem [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH**
- MAJOR: Breaking changes
- MINOR: Novas features, backward-compatible
- PATCH: Bugfixes, backward-compatible

Tags em changelog:
- `Adicionado` - New features
- `Mudado` - Changes in existing functionality
- `Corrigido` - Bug fixes
- `Removido` - Removed features
- `Segurança` - Security fixes
- `Deprecado` - Features to be removed

---

For old versions, see [RELEASES](https://github.com/marcelo-m7/facodi/releases).


