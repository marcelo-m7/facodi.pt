# CODOO

Metodologia operacional usada no projeto para entrega previsivel com suporte de IA.

## 1) Objetivo

Garantir que mudancas em Odoo/FACODI sejam:
- reprodutiveis
- auditaveis
- seguras

## 2) Contrato de Execucao

Base de trabalho:
1. Spec/requisito claro
2. Implementacao incremental
3. Gates de validacao
4. Evidencias em log
5. Relato de riscos/limitacoes

## 3) Gates Recomendados

Aplicar conforme impacto da mudanca:
- install/upgrade (quando houver instalacao ou configuracao Odoo)
- API CRUD
- UI flow
- console sem erros relevantes
- permissao/acesso

## 4) Ordem Deterministica para Tasks Mutaveis

1. `inspect`
2. `dry-run`
3. `apply`
4. `verify`

## 5) Evidencia

Salvar resultados em `docs/logs/` com:
- task
- modo
- timestamp
- status
- erros (quando houver)

## 6) SaaS e Limitacoes

Se Odoo SaaS bloquear algum fluxo:
- registrar erro e contexto
- tentar correcoes concretas
- documentar workaround suportado ou limitacao definitiva

## 7) Regras de Seguranca

- nunca logar segredos
- nunca commitar credenciais
- validar conectividade por `authenticate()` (XML-RPC), nao por GET simples

## 8) Referencias

- [AGENTS.md](../../AGENTS.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [SECURITY.md](./SECURITY.md)
- [ODOO-SAAS-LIMITATIONS.md](./ODOO-SAAS-LIMITATIONS.md)
