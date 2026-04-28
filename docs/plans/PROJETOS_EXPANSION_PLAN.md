# Expansion Plan: Studio "Projetos" App → Full Odoo Project Module

**Status**: Planning  
**Date**: April 27, 2026  
**Scope**: Replicate complete Odoo 19 project module via Studio API

---

## Current State

**x_projetos Model**:
- 7 total fields (6 system defaults + 1 custom)
- Only field: `x_name` (Char, Name)
- No relationships, no views, no business logic

**Target State**:
- Replicate `project.project` model exactly
- 50+ fields with full business logic
- 5 main views (form, list, kanban, calendar, activity)
- Complete relationships (partner, users, tasks, milestones, etc.)
- Full feature set (stages, milestones, collaboration, etc.)

---

## Implementation Strategy

### Phase 1: Core Fields (Priority 1)
Add essential fields that define a project:

```yaml
Basic Identity:
  - x_name: Char (already exists)
  - x_description: Html
  - x_active: Boolean (default=True)
  - x_sequence: Integer (default=10)
  - x_color: Integer

Essential Relationships:
  - x_partner_id: Many2one(res.partner) - Customer
  - x_company_id: Many2one(res.company)
  - x_user_id: Many2one(res.users) - Project Manager
  - x_account_id: Many2one(account.analytic.account)

Timeline:
  - x_date_start: Date
  - x_date: Date (expiration)

Configuration:
  - x_privacy_visibility: Selection [followers|invited_users|employees|portal]
  - x_label_tasks: Char (task name, e.g. "Tasks", "Tickets")
  - x_allow_task_dependencies: Boolean
  - x_allow_milestones: Boolean
  - x_allow_recurring_tasks: Boolean
```

### Phase 2: Relationships & Features (Priority 2)
Add complex relationships and feature toggles:

```yaml
Favorites & Collaboration:
  - x_is_favorite: Boolean (computed)
  - x_favorite_user_ids: Many2many(res.users)
  - x_collaborator_ids: One2many(project.collaborator)

Tagging & Organization:
  - x_tag_ids: Many2many(project.tags)
  - x_type_ids: Many2many(project.task.type) - Task Stages
  - x_stage_id: Many2one(project.project.stage)

Business Objects:
  - x_task_ids: One2many(project.task)
  - x_milestone_ids: One2many(project.milestone)
  - x_update_ids: One2many(project.update)

Metadata:
  - x_is_template: Boolean
  - x_task_properties_definition: Properties
```

### Phase 3: Computed & Workflow Fields (Priority 3)
Add computed fields and workflow state:

```yaml
Counts & Analytics:
  - x_task_count: Integer (computed)
  - x_open_task_count: Integer (computed)
  - x_closed_task_count: Integer (computed)
  - x_collaborator_count: Integer (computed)
  - x_milestone_count: Integer (computed)
  - x_update_count: Integer (computed)

Progress Tracking:
  - x_task_completion_percentage: Float (computed)
  - x_milestone_progress: Integer (computed)
  - x_next_milestone_id: Many2one(project.milestone, computed)

Status & Updates:
  - x_last_update_id: Many2one(project.update)
  - x_last_update_status: Selection [on_track|at_risk|off_track|on_hold|to_define|done]
  - x_last_update_color: Integer (computed)
```

---

## Implementation Phases

### Phase 1A: Create Core Fields (2-3 hours)
Add basic identification and relationship fields via Studio API or direct SQL.

**Method**: Studio API + ir.model.fields creation
- Create 15 core fields
- Set up basic Many2one relationships
- Configure field attributes (required, default, etc.)

**Validation**:
- ✓ All fields created
- ✓ Field types correct
- ✓ Relationships functional

### Phase 1B: Create Views (2-3 hours)
Build essential views:

**Form View** (project form):
- Sections: General Info, Settings, Contacts
- Fields grouped logically
- Kanban status visible

**List View** (project list):
- Project name, customer, manager, stage
- Inline edits for key fields
- Color coding by status

**Kanban View** (by stage):
- Cards grouped by project stage
- Color indicators
- Quick actions

### Phase 2A: Add Relationships (2-3 hours)
Create dependencies on related models:

**Relations to create**:
- `project.task` - if exists, link tasks
- `project.milestone` - if exists, link milestones
- `project.update` - if exists, link updates
- `project.tags` - create if needed
- `project.project.stage` - create if needed

**Validation**:
- ✓ Create task from project form
- ✓ Link existing tasks
- ✓ Task count updates correctly

### Phase 2B: Add Computed Fields (1-2 hours)
Implement server-side calculations:

**Counts**:
- `x_task_count` formula
- `x_open_task_count` formula
- `x_closed_task_count` formula

**Progress**:
- `x_task_completion_percentage` calculation
- `x_next_milestone_id` logic

### Phase 3: Advanced Features (3-4 hours)
Implement optional features:

**Collaboration**:
- Favorite projects (user-specific)
- Project collaborators
- Sharing settings

**Workflow**:
- Stage selection
- Status updates
- Email notifications

**Custom Properties**:
- Task property definitions
- Custom field templates

---

## Field Details

### Basic Fields
```
Name                          Type       Required  Default    Notes
─────────────────────────────────────────────────────────────────
x_name                        Char       ✓                    Project name
x_description                 Html                            Rich text
x_active                      Boolean             True        Soft delete
x_sequence                    Integer             10          Sorting
x_color                       Integer             0           UI color index
x_label_tasks                 Char                'Tasks'     Custom task name
x_is_template                 Boolean             False       Template flag
x_privacy_visibility          Selection  ✓        'portal'    Access control
```

### Relationships
```
Name                          Type              Related Model
──────────────────────────────────────────────────────────────
x_partner_id                  Many2one           res.partner (customer)
x_company_id                  Many2one           res.company
x_user_id                     Many2one           res.users (manager)
x_account_id                  Many2one           account.analytic.account
x_favorite_user_ids           Many2many          res.users
x_collaborator_ids            One2many           project.collaborator
x_task_ids                    One2many           project.task
x_milestone_ids               One2many           project.milestone
x_update_ids                  One2many           project.update
x_tag_ids                      Many2many          project.tags
x_type_ids                     Many2many          project.task.type
x_stage_id                     Many2one           project.project.stage
```

### Timeline Fields
```
x_date_start                  Date               Project start
x_date                        Date               Project expiration
```

---

## Dependencies & Prerequisites

### Required Models
- `project.project.stage` - Must exist or create
- `project.task.type` - Must exist or create
- `project.tags` - Must exist or create

### Soft Dependencies
- `project.task` - For task relationships
- `project.milestone` - For milestone relationships
- `project.update` - For project updates
- `project.collaborator` - For collaboration features

### System Requirements
- Analytic module (for account_id)
- Mail module (for alias_id, notifications)
- Portal module (for privacy_visibility)
- Rating module (if show_ratings needed)

---

## Implementation Tasks

### Task 1: Create Field Infrastructure
**Type**: API calls + DB schema  
**Time**: 2-3 hours  
**Owner**: Developer

Steps:
1. Create ir.model.fields for all Phase 1 fields
2. Set up field relationships
3. Configure field attributes and defaults
4. Validate field creation via API

### Task 2: Build User Interface
**Type**: View creation + XML  
**Time**: 3-4 hours  
**Owner**: UI Developer

Views to create:
- Form (detailed editing)
- List (quick overview, inline edit)
- Kanban (visual by stage)
- Calendar (timeline view)
- Activity (feed view)

### Task 3: Implement Server Logic
**Type**: Python code + ORM methods  
**Time**: 4-6 hours  
**Owner**: Backend Developer

Features:
- Computed field formulas
- Constraint validation
- Automation triggers
- Access rules

### Task 4: Create Relations & Workflows
**Type**: API calls + configuration  
**Time**: 2-3 hours  
**Owner**: Developer

Setup:
- Link to project.task
- Link to project.milestone
- Link to project.update
- Configure automation rules

### Task 5: Add Advanced Features
**Type**: Configuration + ORM  
**Time**: 3-4 hours  
**Owner**: Developer

Features:
- Collaboration (favorites, sharing)
- Stage management
- Milestone tracking
- Update notifications

### Task 6: Testing & Validation
**Type**: Manual + API testing  
**Time**: 2-3 hours  
**Owner**: QA

Gates:
- All fields created
- All views render correctly
- Create/read/update/delete works
- Relationships functional
- Computed fields calculate correctly
- Access rules enforced
- No JS console errors

---

## Estimated Effort

| Phase | Tasks | Hours | Days |
|-------|-------|-------|------|
| 1A    | Fields | 2-3 | 0.5 |
| 1B    | Views | 3-4 | 1 |
| 2A    | Relations | 2-3 | 0.5 |
| 2B    | Computed | 1-2 | 0.5 |
| 3     | Advanced | 3-4 | 1 |
| Test  | Validation | 2-3 | 0.5 |
| **Total** | | **16-21** | **4-5 days** |

---

## Success Criteria

- [ ] All 50+ fields created and visible
- [ ] All 5 main views (form, list, kanban, calendar, activity) functional
- [ ] Create/edit/delete project works end-to-end
- [ ] Relationships to tasks, milestones, updates working
- [ ] Computed field counts update correctly
- [ ] Privacy visibility rules enforced
- [ ] Team collaboration features work
- [ ] No JavaScript console errors
- [ ] Mobile responsive (form, list views)
- [ ] Documentation updated
- [ ] Feature parity with native project module ✓

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Large field count | Complexity, performance | Phased approach, careful naming |
| Relationship conflicts | Data integrity | Validate foreign keys first |
| View rendering issues | UX problems | Test responsive design early |
| Computed field performance | Slow operations | Use context filtering |
| Access rule complexity | Security gaps | Simplify rules initially |

---

## Next Steps

1. **Approval**: Review plan, get sign-off
2. **Preparation**: Gather Odoo module code, set up task structure
3. **Task 1 Start**: Begin field creation (estimate: May 1)
4. **Timeline**: 4-5 business days to completion

---

**Prepared**: AI Planning Agent  
**Status**: Ready for Approval  
**Confidence**: 85% (based on Odoo 19 project module structure)
