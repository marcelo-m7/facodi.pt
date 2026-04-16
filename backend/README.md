# Backend

Esta pasta e reservada para servicos, APIs e integracoes de suporte ao ecossistema FACODI.

## Responsabilidade

- expor logica de dominio que nao pertence ao frontend;
- oferecer pontos de integracao com sistemas externos;
- concentrar componentes de servico reutilizaveis.

## Estado atual

- Estrutura inicial pronta para evolucao incremental.
- A operacao curricular principal atualmente vive em `workspace/odoo/`.

## Convencoes recomendadas

- Cada servico deve ter README proprio com execucao local e variaveis de ambiente.
- Scripts internos devem ficar em subpastas por finalidade.
- Evitar duplicar logica operacional ja consolidada no `workspace/`.
