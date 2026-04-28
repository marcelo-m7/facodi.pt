# Website_Slides Extension Patterns & Best Practices

## Context

This guide documents extensibility patterns proven in FACODI implementation. Use these patterns when extending website_slides without forking core code.

**Key Principle**: SaaS-safe = No custom Python, no core module forks, only semantic fields + QWeb inheritance + inline JavaScript.

---

## Pattern 1: Semantic Field Extension

### Goal
Add custom metadata to models without writing Python code or forking core models.

### Implementation

#### Via XML-RPC (Recommended for SaaS)

```python
import xmlrpc.client
import urllib.parse

host = 'https://edu-facodi.odoo.com'
db = 'edu-facodi'
user = 'user@example.com'
pwd = 'password'

base = f"{urllib.parse.urlparse(host).scheme}://{urllib.parse.urlparse(host).netloc}"
uid = xmlrpc.client.ServerProxy(base + '/xmlrpc/2/common').authenticate(db, user, pwd, {})
models = xmlrpc.client.ServerProxy(base + '/xmlrpc/2/object')

# Get ir.model ID for slide.channel
channel_model = models.execute_kw(db, uid, pwd, 'ir.model', 'search_read',
    [[('model', '=', 'slide.channel')]],
    {'fields': ['id']})

model_id = channel_model[0]['id']

# Create custom field
field_id = models.execute_kw(db, uid, pwd, 'ir.model.fields', 'create', [{
    'model_id': model_id,
    'name': 'x_my_custom_field',
    'field_description': 'My Custom Field',
    'ttype': 'char',  # field type
    'state': 'manual',  # manual = custom field
}])

print(f"Field created: {field_id}")
```

#### Via XML Manifest (For Installable Modules)

```xml
<!-- __manifest__.py style -->
{
    'name': 'My Custom Fields',
    'version': '1.0',
    'depends': ['website_slides'],
    'data': [
        'data/custom_fields.xml',
    ],
}
```

```xml
<!-- data/custom_fields.xml -->
<odoo>
    <data>
        <!-- Add field to slide.channel -->
        <record id="field_x_my_custom" model="ir.model.fields">
            <field name="model_id" ref="website_slides.model_slide_channel"/>
            <field name="name">x_my_custom</field>
            <field name="field_description">My Custom Field</field>
            <field name="ttype">char</field>
            <field name="state">manual</field>
        </record>
    </data>
</odoo>
```

### FACODI Example: Level Field

```python
# Create x_facodi_level field (selection type)
models.execute_kw(db, uid, pwd, 'ir.model.fields', 'create', [{
    'model_id': model_id,
    'name': 'x_facodi_level',
    'field_description': 'Nivel FACODI',
    'ttype': 'selection',
    'state': 'manual',
    'selection_ids': [
        (0, 0, {'name': 'Fundamentos', 'value': 'fundamental'}),
        (0, 0, {'name': 'Intermediário', 'value': 'intermediate'}),
        (0, 0, {'name': 'Avançado', 'value': 'advanced'}),
    ],
}])
```

### When to Use
- Adding metadata without changing logic
- Quick prototyping in SaaS instances
- Per-instance customization
- Non-structural extensions

### Advantages
- ✅ No code changes
- ✅ SaaS-compatible
- ✅ Deterministic (rollbackable)
- ✅ Zero risk to core module

### Limitations
- ❌ Cannot add computed fields (need Python)
- ❌ Cannot add relational fields (no reverse relationships)
- ❌ No validation beyond field-level constraints
- ❌ No business logic hooks

---

## Pattern 2: QWeb Template Inheritance

### Goal
Customize HTML rendering without forking templates or writing Python code.

### Implementation

#### Basic XPath Inheritance

```xml
<record id="my.slides.course.main.custom" model="ir.ui.view">
    <field name="name">Course Main (Custom)</field>
    <field name="model">website</field>
    <field name="inherit_id" ref="website.course_main"/>
    <field name="type">qweb</field>
    <field name="arch" type="xml">
        <!-- Replace course header -->
        <xpath expr="//div[@class='course-header']" position="replace">
            <div class="course-header custom">
                <h1 t-field="slide_channel.name"/>
                <p t-field="slide_channel.description_short"/>
            </div>
        </xpath>
    </field>
</record>
```

#### XPath Operations

| Operation | Syntax | Effect |
|-----------|--------|--------|
| **replace** | `<xpath expr="..." position="replace">...</xpath>` | Remove + insert |
| **before** | `<xpath expr="..." position="before">...</xpath>` | Insert before |
| **after** | `<xpath expr="..." position="after">...</xpath>` | Insert after |
| **inside** | `<xpath expr="..." position="inside">...</xpath>` | Append inside |
| **attributes** | `<xpath expr="..." position="attributes"><attribute name="...">...</attribute></xpath>` | Modify attributes |

### FACODI Example: Course Card Enhancement

```xml
<record id="website.facodi_slides_course_card_inherit" model="ir.ui.view">
    <field name="name">Course Card (FACODI)</field>
    <field name="model">website</field>
    <field name="inherit_id" ref="website.course_card"/>
    <field name="type">qweb</field>
    <field name="arch" type="xml">
        <!-- Add FACODI metadata to card footer -->
        <xpath expr="//div[@class='course-card-footer']" position="inside">
            <div class="facodi-badges">
                <span class="badge badge-level" t-if="slide_channel.x_facodi_level">
                    <t t-out="slide_channel.x_facodi_level"/>
                </span>
                <span class="badge badge-hours" t-if="slide_channel.x_facodi_workload_hours">
                    <t t-out="slide_channel.x_facodi_workload_hours"/> h
                </span>
            </div>
        </xpath>
        
        <!-- Add data attributes for JavaScript filtering -->
        <xpath expr="//div[@class='course-card']" position="attributes">
            <attribute name="data-facodi-level" t-att-data-facodi-level="slide_channel.x_facodi_level or ''"/>
            <attribute name="data-facodi-competency" t-att-data-facodi-competency="slide_channel.x_facodi_competency or ''"/>
        </xpath>
    </field>
</record>
```

### QWeb Template Tags (Reference)

| Tag | Purpose |
|-----|---------|
| `<t t-out="expr">` | Render expression (escaped) |
| `<t t-esc="expr">` | Escape and render |
| `<t t-set="var" t-value="expr">` | Set variable |
| `<t t-foreach="list" t-as="item">` | Loop |
| `<t t-if="cond">` | Conditional |
| `<t t-call="template">` | Include template |
| `t-attf-attr="..."` | Format attribute |
| `t-att-attr="expr"` | Dynamic attribute |
| `t-options="{...}"` | Template options |

### When to Use
- Changing HTML structure
- Adding visual customizations
- Injecting semantic HTML
- Hiding/showing sections conditionally
- Data attributes for JavaScript

### Advantages
- ✅ No fork needed
- ✅ Inherits future core updates
- ✅ SaaS-compatible
- ✅ Pure markup/styling

### Limitations
- ❌ Cannot add computed logic
- ❌ Limited to layout/display
- ❌ Complex conditionals get unwieldy
- ❌ No access to Python business logic

---

## Pattern 3: JavaScript Client-Side Filtering

### Goal
Add interactive filters without modifying data models or server logic.

### Implementation

#### Inline in QWeb Template

```xml
<record id="my.slides.filter" model="ir.ui.view">
    <field name="name">Slides Filter UI</field>
    <field name="model">website</field>
    <field name="inherit_id" ref="website.course_home"/>
    <field name="type">qweb</field>
    <field name="arch" type="xml">
        <!-- Add filter bar before course list -->
        <xpath expr="//section[@class='courses']" position="before">
            <section class="facodi-filters" id="facodi-filters">
                <div class="filter-group">
                    <label for="filter-level">Nível:</label>
                    <select id="filter-level" class="facodi-filter" data-filter-type="level">
                        <option value="">Todos os níveis</option>
                        <option value="Fundamentos">Fundamentos</option>
                        <option value="Intermediário">Intermediário</option>
                        <option value="Avançado">Avançado</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label for="filter-competency">Competência:</label>
                    <select id="filter-competency" class="facodi-filter" data-filter-type="competency">
                        <option value="">Todas as competências</option>
                        <option value="Segurança Digital">Segurança Digital</option>
                        <option value="Design Thinking">Design Thinking</option>
                        <option value="Liderança Digital">Liderança Digital</option>
                    </select>
                </div>
                
                <button id="reset-filters" class="btn btn-secondary">
                    Limpar filtros
                </button>
            </section>
        </xpath>
        
        <!-- Add filter data attributes to cards -->
        <xpath expr="//div[@class='course-card']" position="attributes">
            <attribute name="data-facodi-level" t-att-data-facodi-level="card.x_facodi_level or ''"/>
            <attribute name="data-facodi-competency" t-att-data-facodi-competency="card.x_facodi_competency or ''"/>
        </xpath>
        
        <!-- JavaScript filtering logic -->
        <xpath expr="//section[@class='courses']" position="after">
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    const filterElements = document.querySelectorAll('.facodi-filter');
                    const cards = document.querySelectorAll('[data-facodi-level]');
                    const noResults = document.createElement('div');
                    noResults.className = 'no-results';
                    noResults.textContent = 'Nenhum curso encontrado com esses filtros.';
                    noResults.style.display = 'none';
                    
                    function applyFilters() {
                        const filters = {};
                        filterElements.forEach(el => {
                            const type = el.dataset.filterType;
                            filters[type] = el.value;
                        });
                        
                        let visibleCount = 0;
                        cards.forEach(card => {
                            let show = true;
                            
                            if (filters.level && card.dataset.facodiLevel !== filters.level) {
                                show = false;
                            }
                            if (filters.competency && card.dataset.facodiCompetency !== filters.competency) {
                                show = false;
                            }
                            
                            card.style.display = show ? 'block' : 'none';
                            if (show) visibleCount++;
                        });
                        
                        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
                    }
                    
                    filterElements.forEach(el => {
                        el.addEventListener('change', applyFilters);
                    });
                    
                    document.getElementById('reset-filters')?.addEventListener('click', function() {
                        filterElements.forEach(el => el.value = '');
                        applyFilters();
                    });
                });
            </script>
        </xpath>
    </field>
</record>
```

### When to Use
- Instant filtering without page reload
- Client-side sorting/organization
- Interactive data visualization
- Form validation
- Dynamic UI behavior

### Advantages
- ✅ No server round-trip
- ✅ Responsive user experience
- ✅ Works offline
- ✅ No Python knowledge needed

### Limitations
- ❌ Only filters existing data
- ❌ Cannot add new records
- ❌ Cannot validate business logic
- ❌ Dependent on data attributes in HTML

---

## Pattern 4: External Resource Linking

### Goal
Attach supplementary materials, external links, or curriculum references without modifying core models.

### Implementation

#### Via ir.attachment (Recommended)

```python
# Create URL attachment for a slide
models.execute_kw(db, uid, pwd, 'ir.attachment', 'create', [{
    'name': 'UALG Official Curriculum',
    'type': 'url',
    'url': 'https://www.ualg.pt/curso/1941/plano',
    'res_model': 'slide.slide',
    'res_id': slide_id,
    'public': True,
    'description': 'Official UALG curriculum document',
}])
```

#### Via slide.slide.resource (If resource_type supports it)

```python
# Create resource reference
models.execute_kw(db, uid, pwd, 'slide.slide.resource', 'create', [{
    'slide_id': slide_id,
    'resource_type': 'external_link',
    # Check available fields via fields_get()
}])
```

#### Display in Template

```xml
<record id="my.slides.course.resources" model="ir.ui.view">
    <field name="name">Course Resources (Custom)</field>
    <field name="model">website</field>
    <field name="inherit_id" ref="website.course_main"/>
    <field name="type">qweb</field>
    <field name="arch" type="xml">
        <!-- Add resources section after course description -->
        <xpath expr="//div[@class='course-description']" position="after">
            <div class="course-resources" t-if="slide_channel.attachment_ids">
                <h3>Recursos Adicionais</h3>
                <ul>
                    <li t-foreach="slide_channel.attachment_ids" t-as="attachment">
                        <a t-att-href="attachment.url or '#'" target="_blank">
                            <i class="fa fa-link"/> <t t-out="attachment.name"/>
                        </a>
                    </li>
                </ul>
            </div>
        </xpath>
    </field>
</record>
```

### When to Use
- Adding external references
- Curriculum linking
- Downloadable materials
- Source attribution
- Related content

### Advantages
- ✅ No model changes
- ✅ Flexible attachment types
- ✅ Version-aware (tracks updates)
- ✅ Access-controlled

### Limitations
- ❌ Limited query flexibility
- ❌ No rich metadata
- ❌ URL validation depends on user input

---

## Pattern 5: Gamification & Engagement Hooks

### Goal
Integrate with Odoo's gamification module to reward learner engagement.

### Implementation

```python
# Create gamification challenge for course completion
models.execute_kw(db, uid, pwd, 'gamification.challenge', 'create', [{
    'name': 'Complete Course: Advanced Python',
    'challenge_category': 'slides_completion',
    'user_ids': [(6, 0, [user_id])],
    'reward_id': 1,  # Badge ID
    'state': 'inprogress',
}])

# Link quiz completion to points
models.execute_kw(db, uid, pwd, 'gamification.goal', 'create', [{
    'user_id': user_id,
    'challenge_id': challenge_id,
    'goal_description': 'Complete all quizzes in course',
}])
```

### In Templates

```xml
<!-- Add gamification UI to course header -->
<div class="gamification-status" t-if="current_user">
    <span class="badge badge-info">
        <t t-out="current_user.gamification_points"/> points
    </span>
</div>
```

---

## Pattern 6: Mail Integration for Notifications

### Goal
Send automated communications on learning milestones.

### Implementation

```python
# Create mail template for course completion
models.execute_kw(db, uid, pwd, 'mail.template', 'create', [{
    'name': 'Course Completion Notification',
    'model_id': model_id,  # slide.channel.partner
    'email_from': '${object.channel_website_id.company_id.email}',
    'email_to': '${object.partner_id.email}',
    'subject': 'Parabéns! Você completou ${object.channel_id.name}',
    'body_html': '''<p>Bem-vindo ao seu novo conhecimento!</p>
        <p>Você completou: <strong>${object.channel_id.name}</strong></p>
        <p>Próximas recomendações: [COURSES LINKS]</p>
        <a href="/slides">Explorar mais cursos</a>''',
}])

# Send on completion
models.execute_kw(db, uid, pwd, 'mail.template', 'send_mail', [template_id], {
    'force_send': True,
})
```

---

## Best Practices & Safeguards

### 1. Dry-Run & Verification

Always test changes before deploying:

```python
# 1. Dry-run (list changes without applying)
print("Planned changes:")
print(f"  - Create field: x_my_field")
print(f"  - Create inherit: my.custom.view")
print("Ready? (y/n)")

# 2. Test on staging first
# 3. Backup data
# 4. Apply incrementally
# 5. Verify each step
```

### 2. Rollback Capability

Keep track of IDs for rollback:

```python
# Store created IDs
created_ids = {
    'field': field_id,
    'view': view_id,
    'attachment': attachment_id,
}

# Save to file
with open('deployment_log.json', 'w') as f:
    json.dump(created_ids, f)

# If error: delete in reverse order
for item_id in reversed(created_ids.values()):
    models.execute_kw(db, uid, pwd, model, 'unlink', [item_id])
```

### 3. Data Validation

Validate before and after changes:

```python
# Before: snapshot
before = models.execute_kw(db, uid, pwd, 'slide.channel', 'search_read',
    [[]], {'fields': ['id', 'name', 'x_facodi_level']})

# Make changes...

# After: verify
after = models.execute_kw(db, uid, pwd, 'slide.channel', 'search_read',
    [[]], {'fields': ['id', 'name', 'x_facodi_level']})

# Assert changes are correct
assert len(after) == len(before), "Record count changed!"
```

### 4. Documentation

Document why each extension exists:

```xml
<record id="my.custom.field" model="ir.model.fields">
    <!-- REASON: Add learner engagement metric tracking -->
    <!-- TICKET: FACODI-2024-001 -->
    <!-- OWNER: marcelo@facodi.pt -->
    <!-- DATE: 2026-04-21 -->
    <field name="name">x_engagement_score</field>
    ...
</record>
```

### 5. Testing Checklist

Before considering a change complete:

- [ ] Field exists and is readable via XML-RPC
- [ ] Field values can be set and retrieved
- [ ] Template renders without errors
- [ ] No JavaScript console errors
- [ ] Filters work as expected
- [ ] Data exports correctly
- [ ] Access control rules are enforced
- [ ] Mobile layout is acceptable

---

## Roadmap: Future Extension Opportunities

### ✅ Completed
1. **Semantic Field Extension** — x_facodi_* fields (38 total)
2. **QWeb Inheritance** — courses_home, course_nav, course_main
3. **Public Pages** — /home, /sobre, /faq, /contribuir
4. **Tag Taxonomy** — 5 FACODI-specific tags

### 📋 Planned (Next Increments)

#### Phase 1: Learner Experience
1. **Trilhas Discovery Filters** — Client-side filtering by level + competency
2. **Slide Progress Indicators** — Visual progress bar in templates
3. **Recommended Courses** — "Similar courses" based on tags
4. **Learner Dashboard** — My courses, my progress, certificates

#### Phase 2: Instructor Tools
1. **Course Analytics** — Enrollment, completion, engagement metrics
2. **Student Performance Tracking** — Quiz scores, time spent, milestones
3. **Batch Communication** — Email groups of learners
4. **Certificate Generation** — PDF certificates with FACODI branding

#### Phase 3: Content Integration
1. **External Curriculum Linking** — UALG integration (slide.slide.resource)
2. **Content Versioning** — Track course curriculum versions
3. **Source Attribution** — Metadata about content origin
4. **License Compliance** — Automated license tracking

#### Phase 4: Advanced Features
1. **Personalized Learning Paths** — Adaptive course sequencing
2. **Peer Interaction** — Comments, discussions, peer review
3. **Micro-credentials** — Digital badges + blockchain verification
4. **Integration with HR Systems** — Competency mapping, skills tracking

---

## References

- **FACODI Instance**: https://edu-facodi.odoo.com
- **Core Feature Docs**: docs/features/feature-facodi-elearning-foundation.md
- **Module Reference**: docs/guides/website-slides-deep-reference.md
- **Example Scripts**: src/codoo/tasks/ (e adapters/odoo/ para integração)

---

**Last Updated**: 2026-04-21
**Scope**: SaaS-safe extension patterns for website_slides module
