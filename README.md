# FACODI — Faculdade Comunitária Digital

**FACODI** é uma plataforma EAD gratuita e open-source inspirada nos planos curriculares da Universidade do Algarve (UALG).
Nosso objetivo é **democratizar o acesso ao ensino superior** por meio de trilhas de estudo organizadas em cursos, unidades curriculares e playlists do YouTube.

🚀 Projeto mantido pela [Monynha Softwares](https://monynha.com).

---

## ✨ Funcionalidades

- 📚 Catálogo de cursos e currículos completos (40+ UCs do LESTI)
- 🎥 Aulas organizadas em **playlists do YouTube**
- 📝 Conteúdo textual em **Markdown versionado**
- 🌙 Alternância de tema (claro/escuro) com persistência da preferência
- 🌍 Interface multi-idioma (PT como padrão + EN / ES / FR configurados)
- ♿ **WCAG 2.1 AA Acessibilidade** com suporte a teclado e leitores de tela
- 🧪 **Suite de testes automatizados** (Vitest com 19+ testes)
- ⚡ Geração estática com Hugo - sem dependências de backend

---

## 🏗️ Arquitetura

**Stack Atual** (Phase 3 - Supabase integrado):
- **Frontend**: [Hugo](https://gohugo.io) v0.150.0+ com tema [Doks](https://getdoks.com)
- **Styling**: SCSS customizado com tokens Monynha + Bootstrap 5.3.3
- **Renderização**: Vanilla JS puro (Marked.js para Markdown) + Supabase JS v2
- **Conteúdo**: Markdown versionado em `content/` com TOML front matter
- **Base de Dados**: Supabase (PostgreSQL) com schemas `catalog`, `subjects`, `mapping`
- **Deploy**: Site estático gerado via `hugo` (Netlify, Vercel, GitHub Pages)
- **CI/CD**: GitHub Actions – validação de front matter, sync `.md → DB`, auto-deploy
- **Testing**: Vitest com jsdom, 19+ testes de renderização, cobertura V8
- **Acessibilidade**: WCAG 2.1 AA compliant com focus indicators, ARIA landmarks, skip links

**Integração Supabase**:
- ✅ `static/js/supabaseClient.js` — inicializa `createClient` com chave anon
- ✅ `static/js/loaders.js` — `loadCoursePage`, `loadUCPage`, `loadTopicPage`
- ✅ `supabase/migrations/` — schema SQL + RLS
- ✅ `supabase/seed.sql` — dados iniciais (LESTI 2024/2025)
- ✅ `scripts/sync-to-supabase.js` — sincroniza `.md → DB` via service key

## 📂 Estrutura do Repositório

```
facodi.pt/
├─ README.md
├─ AGENTS.md
├─ package.json / package-lock.json
├─ vitest.config.js                # Configuração de testes
├─ config/
│   └─ _default/                   # Configurações do Hugo
├─ layouts/                        # Templates Hugo
│   └─ _partials/                  # Cabeçalho, rodapé e scripts
├─ content/
│   └─ courses/
│       └─ lesti/
│           └─ uc/                 # 40+ Unidades Curriculares
├─ static/
│   └─ js/
│       ├─ supabaseClient.js        # Inicializa createClient Supabase
│       └─ loaders.js               # loadCoursePage / loadUCPage / loadTopicPage
├─ assets/
│   └─ css/
│       └─ facodi.css               # Estilos + 280 linhas accessibility
├─ scripts/
│   └─ sync-to-supabase.js         # Sincroniza .md → Supabase DB
├─ supabase/
│   ├─ migrations/
│   │   ├─ 001_initial_schema.sql  # Schemas catalog / subjects / mapping
│   │   └─ 002_rls.sql             # Row-Level Security policies
│   └─ seed.sql                    # Dados iniciais (LESTI 2024/2025)
├─ tests/                           # Suite de testes Vitest
│   ├─ setup.js
│   └─ loaders.test.js              # 19 testes unitários
├─ docs/
│   ├─ FACODI.md, PLAN.md, SECURITY.md, VISUAL.md
│   ├─ MIGRATION_STATIC.md
│   ├─ DEVELOPER_GUIDE.md
│   ├─ ACCESSIBILITY_IMPROVEMENTS.md
│   └─ PHASE_2_SUMMARY.md
└─ .github/workflows/
    ├─ validate-content.yml         # Validação + build Hugo
    ├─ validate-md.yml              # Validação de front matter
    ├─ sync-md-to-supabase.yml      # Sync .md → DB
    └─ deploy.yml                   # Deploy automático
```

---

## 📖 Documentação

Consulte os documentos disponíveis:

- [docs/FACODI.md](docs/FACODI.md) — Visão geral e objetivos
- [docs/PLAN.md](docs/PLAN.md) — Planejamento e roadmap
- [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) — **Novo**: Guia para devs
- [docs/ACCESSIBILITY_IMPROVEMENTS.md](docs/ACCESSIBILITY_IMPROVEMENTS.md) — **Novo**: WCAG 2.1 AA
- [docs/PHASE_2_SUMMARY.md](docs/PHASE_2_SUMMARY.md) — **Novo**: Phase 2 Recap

---

## ⚙️ Como rodar localmente

```bash
# Clonar o repositório
git clone https://github.com/Monynha-Softwares/facodi.pt.git
cd facodi.pt

# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev                    # http://localhost:1313

# Build para produção
npm run build                  # gera /public

# Sincronizar conteúdo Markdown → Supabase (requer service key)
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/sync-to-supabase.js

# Rodar testes
npm test                       # Modo watch
npm run test:coverage         # Coverage report
```

---

## 🧪 Suite de Testes

**Status**: ✅ 19/19 testes passando

```bash
npm test                      # Modo watch
npm run test:coverage         # Relatório V8
```

Testes inclusos:
- HTML escaping (XSS prevention)
- Count formatting (singular/plural)
- Tag rendering, Playlist rendering
- Content structure validation
- Front matter compliance

---

## ♿ Acessibilidade (WCAG 2.1 AA)

**Status**: ✅ Baseline implementado

- **Focus Indicators**: 3px outline (WCAG AAA)
- **Skip Links**: Keyboard-only visibility
- **Semantic HTML**: `<main>`, `<nav>`, ARIA labels
- **Keyboard Navigation**: Full Tab/Arrow support
- **Motion Sensitivity**: `prefers-reduced-motion`
- **High Contrast**: `prefers-contrast: more`
- **Color Contrast**: AA verified (4.5:1+)
- **Touch Targets**: 44x44px (WCAG AAA)

---

## 📊 Status do Projeto

### 📋PLANNED
- [ ] Axe/Lighthouse testing
- [ ] Screen reader verification
- [ ] Performance optimization
- [ ] Content expansion
- [ ] Expand playlist content

---

## 🤝 Contribuindo

FACODI é open-source!

1. Fork e abra Pull Request
2. Reporte bugs em [Issues](../../issues)
3. Traduza conteúdos (PT → EN/ES/FR)
4. Revise planos curriculares

Consulte [`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## 📈 Métricas

**Build**: 1,229 páginas | 13.7s | Zero erros
**Tests**: 19/19 passing | 100% rate
**Accessibility**: WCAG 2.1 AA | Focus AAA | 280+ CSS lines

---

## 👩‍💻 Autores & Créditos

- [Marcelo Santos](https://github.com/marcelo-m7) — fundador
- Comunidade Monynha Softwares
- Base acadêmica: [UALG](https://www.ualg.pt)

---

## 📜 Licença

MIT License — Ver [`LICENSE`](./LICENSE)
