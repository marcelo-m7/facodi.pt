# Guia Visual: Criar App "Projetos" no Odoo Studio

## 📋 Sumário Rápido

Este guia mostra como criar um app "Projetos" idêntico ao padrão da Odoo usando o **Studio visual** (recomendado para SaaS).

**Tempo estimado**: 15-20 minutos

---

## 🎯 Objetivo Final

Criar um app funcional com:
- ✅ 9 campos (name, description, partner, manager, datas, status, prioridade, cor)
- ✅ 2 vistas principais (Árvore, Formulário)
- ✅ Menu em "Aplicações"
- ✅ Permissões configuradas
- ✅ Pronto para usar

---

## 📖 Passo-a-Passo

### 1. Acessar Studio

1. No Odoo, clique em seu **Avatar** (canto superior direito)
2. Procure por **Studio** nos apps
   - Se não aparecer, vá para **Aplicações** > procure "Studio" > **Instalar**

3. Abra **Studio**

### 2. Criar Novo App

1. No Studio, clique em **[+ Novo App]**

2. Preencha:
   - **Nome**: `Projetos`
   - **Model ID**: `x_projetos` (gerado automaticamente ou deixar como sugerido)
   - **Descrição**: "Gerenciamento de projetos"

3. Clique em **[Criar]** ou **[Create]**

### 3. Adicionar Campos (9 no Total)

Ordem recomendada:

#### Campo 1: **Nome do Projeto** 🔴 (Obrigatório)
- **Type**: Char (Texto Curto)
- **Label**: Nome do Projeto
- **Obrigatório**: ✓ Marcado
- **Help**: "Digite o nome do projeto"

#### Campo 2: **Descrição**
- **Type**: Text (Texto Longo)
- **Label**: Descrição
- **Help**: "Descrição detalhada do projeto"

#### Campo 3: **Cliente**
- **Type**: Many2One (Relação)
- **Label**: Cliente
- **Referenciar**: res.partner (Parceiros)

#### Campo 4: **Gerente de Projeto**
- **Type**: Many2One (Relação)
- **Label**: Gerente de Projeto
- **Referenciar**: res.users (Usuários)

#### Campo 5: **Data de Início**
- **Type**: Date (Data)
- **Label**: Data de Início

#### Campo 6: **Data Final**
- **Type**: Date (Data)
- **Label**: Data Final

#### Campo 7: **Status** 
- **Type**: Selection (Lista)
- **Label**: Status
- **Opções**:
  - `draft` → Rascunho
  - `open` → Em Andamento
  - `closed` → Fechado
- **Valor Padrão**: draft

#### Campo 8: **Prioridade**
- **Type**: Selection (Lista)
- **Label**: Prioridade
- **Opções**:
  - `low` → Baixa
  - `medium` → Média
  - `high` → Alta
- **Valor Padrão**: medium

#### Campo 9: **Cor**
- **Type**: Integer (Número)
- **Label**: Cor
- **Help**: "Para Kanban (0-11)"

**✓ Todos os 9 campos adicionados!**

### 4. Criar Vista em Árvore (Lista)

1. Em **Studio**, clique em **+ Adicionar Vista** (ou existing)

2. Selecione **Tipo**: Tree (Árvore)

3. Configure colunas:
   - ✓ Nome do Projeto (name)
   - ✓ Gerente de Projeto (user_id)
   - ✓ Status (state)

4. Salve

### 5. Criar Vista de Formulário

1. Clique em **+ Adicionar Vista** ou edite a existente

2. Selecione **Tipo**: Form (Formulário)

3. Configure layout:
   ```
   Sheet
   └── Group (2 colunas)
       ├── Group "Informações Básicas"
       │   ├── Nome do Projeto
       │   ├── Cliente
       │   └── Gerente de Projeto
       ├── Group "Datas"
       │   ├── Data de Início
       │   └── Data Final
       └── Group "Status"
           ├── Status
           └── Prioridade
   
   Field "Descrição" (full width, sem label)
   ```

4. Salve

### 6. Adicionar Menu

1. Em **Studio**, localize a seção **Menu**

2. Clique **+ Adicionar Menu**

3. Configure:
   - **Label**: Projetos
   - **Menu Pai**: Applications
   - **Sequência**: 10
   - **Ícone**: (opcional) Escolha um ícone apropriado

4. Salve

### 7. Configurar Permissões (ACL)

1. Saia do Studio

2. Vá para **Configurações** > **Segurança** > **Direitos de Acesso**

3. Crie novo registro:
   - **Name**: Projetos - Users
   - **Model**: x_projetos
   - **Group**: Users
   - **Permissions**: ✓ Read, ✓ Create, ✓ Write, ✓ Delete

4. Repita para grupo "Manager" (opcional)

5. Salve

### 8. Publicar App

1. Volte para Studio

2. Clique **[Publicar]** (Publish)

3. Aguarde (pode levar alguns segundos)

4. **✓ App publicado com sucesso!**

---

## 🧪 Testar o App

### 1. Acessar o App

1. Vá para **Aplicações**
2. Procure por **Projetos** (deve aparecer em destaque ou recente)
3. Clique para abrir

### 2. Criar um Projeto de Teste

1. Clique em **[+ Novo]** ou **[Create]**

2. Preencha:
   - **Nome do Projeto**: "Projeto Teste"
   - **Cliente**: (selecione qualquer cliente)
   - **Gerente**: (selecione você mesmo)
   - **Data de Início**: hoje
   - **Data Final**: 30 dias após hoje
   - **Status**: Em Andamento
   - **Prioridade**: Média
   - **Descrição**: "Teste de funcionalidade"

3. Clique **[Salvar]**

### 3. Validar Funcionamento

- ✓ Projeto aparece na lista (vista tree)
- ✓ Consegue editar clicando no projeto
- ✓ Mudanças são salvas
- ✓ Consegue criar novo projeto novamente

---

## 🐛 Problemas Comuns & Soluções

| Problema | Causa | Solução |
|----------|-------|---------|
| App não aparece em Aplicações | Não foi publicado | Volte ao Studio e clique **[Publicar]** |
| Erro "Permissão negada" | ACL não configurada | Crie registro em **Direitos de Acesso** |
| Campo many2one não mostra opções | Relação inválida | Verifique modelo referenciado existe |
| Vista forma não carrega | Campo com erro | Remova campo problemático, teste com char/text |
| Menu não aparece | Configuração errada | Verifique **Menu Parent** = "Applications" |

---

## 📊 Estrutura de Dados Referência

```
Modelo: x_projetos

┌─ name (char, obrigatório)
├─ description (text)
├─ partner_id (many2one → res.partner)
├─ user_id (many2one → res.users)
├─ date_start (date)
├─ date_end (date)
├─ state (selection: draft/open/closed)
├─ priority (selection: low/medium/high)
└─ color (integer)
```

---

## 🎓 Próximos Passos

Após criar o app básico, você pode:

1. **Adicionar vista Kanban** (arrastar/soltar por status)
2. **Criar tarefas relacionadas** (many2many com uma tabela de tarefas)
3. **Adicionar relatórios** (visão por cliente, por gerente)
4. **Configurar automação** (auto-mudar status em data final)
5. **Integrar com agenda** (sincronizar eventos)

---

## 📚 Arquivos de Referência

- **Estrutura**: `docs/logs/projects_app_structure_20260427_210902.json`
- **Guia Completo**: `docs/guides/CREATE_PROJECTS_APP.md`
- **Script Automatizado** (self-hosted): `inspect_and_clone_projects_app.py`

---

## ✅ Checklist Final

- [ ] App "Projetos" criado em Studio
- [ ] 9 campos adicionados
- [ ] Vista árvore configurada
- [ ] Vista formulário configurada
- [ ] Menu em Aplicações criado
- [ ] Permissões configuradas (ACL)
- [ ] App publicado
- [ ] Teste: Novo projeto criado e salvo
- [ ] Teste: Projeto editado com sucesso
- [ ] Teste: Projeto aparece na lista

---

**Você criou com sucesso um app "Projetos" funcional idêntico ao padrão da Odoo!** 🎉
