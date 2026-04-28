# Criação de App "Projetos" no Studio Odoo

## Resumo Executivo

Este guia descreve como criar um app "Projetos" idêntico ao padrão da Odoo using o Studio visual (recomendado para SaaS) ou programaticamente (para ambientes auto-hospedados).

## Estrutura do App Projetos

O app foi projetado com a seguinte estrutura:

```json
{
  "app_name": "Projetos",
  "model_name": "x_projetos",
  "description": "Gerenciamento de projetos",
  "fields": {
    "name": "Nome do Projeto (obrigatório, Char)",
    "description": "Descrição (Text)",
    "partner_id": "Cliente (many2one → res.partner)",
    "user_id": "Gerente de Projeto (many2one → res.users)",
    "date_start": "Data de Início (Date)",
    "date_end": "Data Final (Date)",
    "state": "Status (Selection: draft/open/closed)",
    "priority": "Prioridade (Selection: low/medium/high)",
    "color": "Cor (Integer)"
  },
  "views": [
    {
      "name": "Árvore",
      "type": "tree",
      "fields": ["name", "user_id", "state"]
    },
    {
      "name": "Formulário",
      "type": "form",
      "layout": "Groups with sheets"
    }
  ],
  "acl": [
    {
      "group": "Users",
      "permissions": ["read", "create", "write", "delete"]
    },
    {
      "group": "Manager",
      "permissions": ["read", "create", "write", "delete"]
    }
  ]
}
```

## Opção 1: Criar via Studio (Recomendado para SaaS)

### Passo 1: Acessar Studio

1. No Odoo, vá para **Aplicações** (Applications)
2. Procure por **Studio** e instale se não estiver disponível
3. Acesse **Studio** → **Novo App** (New App)

### Passo 2: Criar o Modelo Base

1. Clique em **Create a New Model**
2. Nome do modelo: `Projetos`
3. Model identifier: `x_projetos`
4. Descrição: "Gerenciamento de projetos"
5. Clique em **Create**

### Passo 3: Adicionar Campos

No formulário de configuração, adicione os seguintes campos (na ordem):

| Campo | Tipo | Label PT-BR | Obrigatório | Notas |
|-------|------|-----------|-----------|-------|
| name | Char | Nome do Projeto | ✓ | Tamanho: 255 |
| description | Text | Descrição | | - |
| partner_id | Many2One | Cliente | | Referenciar: res.partner |
| user_id | Many2One | Gerente de Projeto | | Referenciar: res.users |
| date_start | Date | Data de Início | | - |
| date_end | Date | Data Final | | - |
| state | Selection | Status | | Opções: Rascunho/Em Andamento/Fechado |
| priority | Selection | Prioridade | | Opções: Baixa/Média/Alta |
| color | Integer | Cor | | Para Kanban (0-11) |

### Passo 4: Customizar Vistas

#### Vista em Árvore (Tree View)

Acesse **Studio** → **x_projetos** → **Views** → **+ Add**

Defina:

```xml
<tree>
    <field name="name" />
    <field name="user_id" />
    <field name="state" />
</tree>
```

#### Vista de Formulário (Form View)

```xml
<form>
    <sheet>
        <group>
            <group string="Informações Básicas">
                <field name="name" />
                <field name="partner_id" />
                <field name="user_id" />
            </group>
            <group string="Datas">
                <field name="date_start" />
                <field name="date_end" />
            </group>
        </group>
        <group>
            <group string="Status">
                <field name="state" />
                <field name="priority" />
            </group>
        </group>
        <field name="description" nolabel="1" />
    </sheet>
</form>
```

### Passo 5: Adicionar Menu e Ações

1. Em **Studio**, clique em **+ Add Menu**
2. Label: "Projetos"
3. Parent: "Applications"
4. Sequência: 10
5. Clique em **Save**

Studio criará automaticamente a ação (ir.actions.act_window).

### Passo 6: Configurar Permissões (ACL)

1. Vá para **Configurações** → **Segurança** (Security)
2. Procure por regras de acesso (Access Rights)
3. Crie registros de acesso para:
   - **Grupo**: Users
     - Permissões: ✓ Read, ✓ Create, ✓ Write, ✓ Delete
   - **Grupo**: Manager (opcional)
     - Permissões: ✓ Read, ✓ Create, ✓ Write, ✓ Delete

### Passo 7: Publicar e Ativar

1. Em **Studio**, clique em **Publicar** (Publish)
2. O app estará disponível no menu **Aplicações**
3. Acesse via menu: **Aplicações** → **Projetos**

## Opção 2: Criar Programaticamente (Ambientes Auto-hospedados)

### Pré-requisitos

- Acesso à API XML-RPC
- Permissões de administrador
- Python 3.8+ com bibliotecas: `requests`, `python-dotenv`

### Script Completo

Veja `inspect_and_clone_projects_app.py` no repositório:

```bash
# Ambiente auto-hospedado (suporta XML-RPC completo)
python inspect_and_clone_projects_app.py
```

O script:
1. ✓ Cria o modelo `x_projetos`
2. ✓ Adiciona todos os 9 campos
3. ✓ Cria vistas (tree, form)
4. ✓ Cria ação (ir.actions.act_window)
5. ✓ Cria menu no Applications
6. ✓ Configura ACL para Users e Manager
7. ✓ Salva evidência em `docs/logs/`

**Limitações SaaS**: A instância SaaS (Odoo.com) restringe criação de modelos via XML-RPC por segurança. Nesse caso, **use o Studio visual**.

### Exemplo de Criação Manual via Python (Self-Hosted)

```python
import xmlrpc.client

# Conectar
common = xmlrpc.client.ServerProxy(f'{host}/xmlrpc/2/common')
uid = common.authenticate(db, user, pwd, {})
models = xmlrpc.client.ServerProxy(f'{host}/xmlrpc/2/object')

# Criar modelo
model_id = models.execute_kw(
    db, uid, pwd, 'ir.model', 'create',
    [{
        'name': 'Projetos',
        'model': 'x_projetos',
        'state': 'custom',
    }]
)

# Criar field
field_id = models.execute_kw(
    db, uid, pwd, 'ir.model.fields', 'create',
    [{
        'name': 'name',
        'model_id': model_id,
        'field_description': 'Nome do Projeto',
        'ttype': 'char',
        'required': True,
    }]
)

# ... adicionar mais fields, views, menus, ACL ...
```

## Validação

### Checklist Pós-Criação

- [ ] App "Projetos" visível em **Aplicações**
- [ ] Menu funciona e abre vista vazia
- [ ] Botão **Criar** disponível
- [ ] Possível criar novo projeto com:
  - Name (obrigatório)
  - Cliente (opcional)
  - Gerente (opcional)
  - Datas (opcional)
- [ ] Vista em árvore mostra projetos criados
- [ ] Vista de formulário carrega corretamente
- [ ] Cada usuário do grupo "Users" consegue:
  - ✓ Ver projetos
  - ✓ Criar projetos
  - ✓ Editar projetos
  - ✓ Deletar projetos

### Teste Rápido

1. Crie um projeto de teste:
   - Nome: "Projeto Teste"
   - Cliente: (selecione qualquer cliente)
   - Status: "Em Andamento"

2. Salve e volte para a lista

3. Verifique que o projeto aparece na árvore

4. Clique para editar

5. Altere o status para "Fechado" e salve

## Troubleshooting

### Problema: "Modelo x_projetos não encontrado"
- **Causa**: Modelo não foi criado ou foi criado com nome diferente
- **Solução**: 
  - Verifique em **Configurações** → **Personalizar** que o modelo existe
  - Se não existe, crie novamente via Studio

### Problema: "Permissão negada ao acessar Projetos"
- **Causa**: ACL não configurada
- **Solução**:
  - Vá para **Configurações** → **Segurança** → **Direitos de Acesso**
  - Crie registro: Modelo=`x_projetos`, Grupo=`Users`, Permissões=✓✓✓✓

### Problema: Vista de formulário não carrega
- **Causa**: Campos referenciais inválidos
- **Solução**:
  - Remova campos many2one/many2many temporariamente
  - Teste com campos simples (char, text, date)

## Próximos Passos

### Estender o App

1. **Adicionar Tarefas relacionadas**:
   - Criar modelo `x_project_task` com campo `project_id` (Many2One → x_projetos)
   - Adicionar vista kanban das tarefas

2. **Adicionar Equipe**:
   - Campo many2many `team_member_ids` (res.users)
   - Vista de equipe

3. **Relatórios**:
   - Relatório de projetos por status
   - Relatório de carga de trabalho por gerente

4. **Integração com Agenda**:
   - Sincronizar datas com calendário de eventos

## Evidência de Execução

Se usou o script, verifique:

```bash
# Estrutura do app
cat docs/logs/projects_app_structure_*.json

# Resultado da criação
cat docs/logs/create_projects_app_*.json
```

## Referências

- [Odoo Studio Documentation](https://www.odoo.com/documentation/19.0/applications/productivity/studio.html)
- [Custom Models via API](https://www.odoo.com/documentation/19.0/developer/reference/orm.html)
- [Security & ACL](https://www.odoo.com/documentation/19.0/developer/reference/security.html)
