# Contributing to FACODI Frontend

Obrigado por contribuir com a plataforma.

## Como Comecar

1. Fork do repositorio.
2. Crie uma branch de trabalho.
3. Rode instalacao e build local:

```bash
corepack enable
pnpm install
pnpm build
```

4. Rode testes E2E quando alterar navegacao, rotas ou comportamento visual:

```bash
pnpm test:e2e
```

## Regras de Codigo

- Use pnpm (nao npm) para manter lockfile consistente.
- Mantenha logica de fonte de dados em services/catalogSource.ts.
- Nao colocar detalhes de banco/provedor em componentes de UI.
- Preserve contratos de types.ts:
  - Course.id
  - CurricularUnit.courseId
  - Playlist.units

## Ambiente e Seguranca

- Nunca commitar .env ou .env.local.
- Nao usar service role key no frontend.
- Em supabase, usar apenas chaves publicaveis.

## Conteudo e Curadoria

- Envio de conteudo audiovisual: https://tube.open2.tech
- Contato institucional e parcerias: https://open2.tech/contact

## Pull Request

Inclua no PR:

- Contexto do problema.
- Resumo da solucao.
- Evidencias de validacao (build/testes).
- Capturas de tela para alteracoes visuais significativas.
