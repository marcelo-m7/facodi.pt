# Accessibility Improvements

Baseline de acessibilidade do frontend FACODI e backlog de evolucao.

## Baseline Atual

- Navegacao com elementos semanticos e rotulos ARIA em componentes principais.
- Controles de menu mobile com `aria-expanded` e `aria-controls`.
- Seletor de idioma com rotulo dedicado para leitores de tela.
- Estrutura de paginas com headings e rotas navegaveis por teclado.

## Evidencias no Codigo

- Rotulos e atributos de navegacao em `components/Layout.tsx`.
- Testes de layout e acessibilidade funcional em `tests/e2e/lesson-detail.spec.ts`.
- Testes de navegacao de estudante em `tests/e2e/student-dashboard.spec.ts`.

## Melhorias Prioritarias

- Adicionar check automatizado com axe-core no pipeline de CI.
- Definir checklist de contraste e foco visivel por componente novo.
- Consolidar guia de uso de `aria-*` para evitar excesso ou uso incorreto.
- Expandir casos E2E com navegacao somente por teclado.

## Melhorias de Medio Prazo

- Auditoria periodica com Lighthouse Accessibility.
- Revisao de linguagem inclusiva em PT e EN no dicionario de i18n.
- Validacao assistida com leitores de tela (NVDA/VoiceOver) em fluxos criticos.

## Criterios de Aceite para Novas Telas

1. Navegacao por teclado sem bloqueios.
2. Elementos interativos com nome acessivel.
3. Hierarquia de heading consistente.
4. Estados de erro e feedback perceptiveis.
