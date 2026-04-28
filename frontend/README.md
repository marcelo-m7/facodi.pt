# FACODI — Faculdade Comunitária Digital

**FACODI** é uma plataforma EAD gratuita e open-source inspirada nos planos curriculares da Universidade do Algarve (UALG).
Nosso objetivo é **democratizar o acesso ao ensino superior** por meio de trilhas de estudo organizadas em cursos, unidades curriculares e playlists do YouTube.

🚀 Projeto mantido pela [Open2 Technology](https://open2.tech).

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

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure optional environment flags in `.env.local`:

   - `VITE_DATA_SOURCE=mock` (default) or `VITE_DATA_SOURCE=odoo`
   - `VITE_BACKEND_URL=http://localhost:8080` (backend FastAPI base URL)

   Exemplo:

   ```dotenv
   VITE_DATA_SOURCE=odoo
   VITE_BACKEND_URL=http://localhost:8080
   ```

3. Run the app:
   `npm run dev`


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
- Comunidade Open2 Technology
- Base acadêmica: [UALG](https://www.ualg.pt)

---

## 📜 Licença

MIT License — Ver [`LICENSE`](./LICENSE)

