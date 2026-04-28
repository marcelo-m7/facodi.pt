# Arquitetura Monorepo + Odoo

Este documento descreve as fronteiras de responsabilidade do projeto FACODI apos a adocao do monorepo e a migracao curricular para Odoo.

## Principios

- Monorepo e a arquitetura oficial.
- Cursos migrados para Odoo sao parte do estado atual da plataforma.
- Documentacao deve refletir operacao real, sem caminhos legados.

## Fronteiras por pasta

- `frontend/`
  - Aplicacao publica FACODI.
  - Responsavel por experiencia do utilizador, navegacao e apresentacao de conteudo.

- `backend/`
  - Camada de servicos e integracoes de suporte.
  - Deve concentrar logica de API e servicos persistentes quando necessarios.

- `workspace/`
  - Operacao interna e automacoes.
  - Inclui fluxos de scraping, normalizacao e sincronizacao de dados.

- `workspace/odoo/`
  - Centro operacional da integracao curricular com Odoo.
  - Contem schema, scripts de importacao incremental e verificacao de sincronizacao.

## Relacao facodi.pt x Odoo

- Odoo e a fonte operacional para entidades curriculares migradas.
- O monorepo organiza codigo e processos de suporte dessa operacao.
- O frontend representa a camada publica de consumo e exposicao de conteudo.

## Origem e destino dos dados

1. Dados de origem curricular sao extraidos e preparados no `workspace/`.
2. IDs e chaves externas sao normalizados para importacao idempotente.
3. Dados sao aplicados no Odoo via scripts em `workspace/odoo/scripts/`.
4. Sincronizacao e validada por relatorios e probes de verificacao.
5. Conteudo e metadados suportam a experiencia publica no `frontend/`.

## Diretrizes de manutencao

- Sempre atualizar documentacao ao mover pastas, scripts ou fluxos.
- Evitar introduzir scripts sem README de uso e finalidade.
- Marcar explicitamente ativos legados e plano de migracao/remoção.
