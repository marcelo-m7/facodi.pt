# Phase 1 Execution: Build Pure Studio Data Model

**Date**: April 27, 2026  
**Status**: Ready for Manual Execution  
**Effort**: 5-7 hours  
**Owner**: UI Developer + Backend Developer

---

## Overview

Phase 1 involves creating 6 custom Studio models to replicate the native Odoo project domain, then adding 15 core fields to `x_projetos`.

**Models to Create**:
1. x_project_stage - Workflow stages
2. x_project_task - Individual project tasks
3. x_project_milestone - Key project milestones
4. x_project_update - Project status updates
5. x_project_tag - Tags for categorization
6. x_project_collaborator - Team members

**Goal**: Enable all Phase 2 view creation and Phase 3 automations.

---

## Step 1: Create x_project_stage Model (30 min)

### Via Studio UI

```
1. Go to Odoo Settings → Studio → Models
2. Click "Create" button
3. Enter model name: x_project_stage
4. Display name: "Project Stage"
5. Click "Create"
6. Add fields:
   ✓ x_name (Char, 128) - Name
   ✓ x_sequence (Integer, 10) - Ordering
   ✓ x_color (Integer, 0) - Color for UI
   ✓ x_description (Text) - Description

7. Create default records:
   - To Do (sequence 10, color 1)
   - In Progress (sequence 20, color 2)
   - Done (sequence 30, color 3)
   
8. Click "Save"
```

**Verification**:
- [ ] Model appears in Models list as "x_project_stage"
- [ ] All 4 fields created and editable
- [ ] Default 3 records exist

---

## Step 2: Create x_project_task Model (45 min)

### Via Studio UI

```
1. Settings → Studio → Models → Create
2. Name: x_project_task
3. Display name: "Project Task"
4. Create
5. Add fields:
   ✓ x_name (Char, 255) - Task Name
   ✓ x_project_id (Many2one → x_projetos) - Project
   ✓ x_assigned_to (Many2one → res.users) - Assigned To
   ✓ x_stage_id (Many2one → x_project_stage) - Stage
   ✓ x_description (Html) - Description
   ✓ x_date_start (Date) - Start Date
   ✓ x_date_deadline (Date) - Deadline
   ✓ x_priority (Selection) - Priority [Low, Medium, High]
   ✓ x_status (Selection) - Status [New, In Progress, Done, Cancelled]
   ✓ x_sequence (Integer, 10) - Order
   
6. Save
```

**Verification**:
- [ ] Model created successfully
- [ ] Can create a test task
- [ ] Can select a project and assign to user

---

## Step 3: Create x_project_milestone Model (30 min)

### Via Studio UI

```
1. Settings → Studio → Models → Create
2. Name: x_project_milestone
3. Display name: "Project Milestone"
4. Create
5. Add fields:
   ✓ x_name (Char, 255) - Milestone Name
   ✓ x_project_id (Many2one → x_projetos) - Project
   ✓ x_date (Date) - Target Date
   ✓ x_description (Text) - Description
   ✓ x_reached (Boolean, False) - Reached?
   ✓ x_sequence (Integer, 10) - Order
   
6. Save
```

**Verification**:
- [ ] Model exists and editable

---

## Step 4: Create x_project_update Model (30 min)

### Via Studio UI

```
1. Settings → Studio → Models → Create
2. Name: x_project_update
3. Display name: "Project Update"
4. Create
5. Add fields:
   ✓ x_project_id (Many2one → x_projetos) - Project
   ✓ x_author_id (Many2one → res.users) - Author
   ✓ x_name (Char, 255) - Subject
   ✓ x_description (Html) - Update Text
   ✓ x_status (Selection) - Status [On Track, At Risk, Off Track, On Hold]
   ✓ x_created_date (Datetime) - Created
   
6. Save
```

**Verification**:
- [ ] Model exists and editable

---

## Step 5: Create x_project_tag Model (20 min)

### Via Studio UI

```
1. Settings → Studio → Models → Create
2. Name: x_project_tag
3. Display name: "Project Tag"
4. Create
5. Add fields:
   ✓ x_name (Char, 128) - Tag Name
   ✓ x_color (Integer, 0) - Color
   
6. Save
```

**Verification**:
- [ ] Model exists

---

## Step 6: Create x_project_collaborator Model (30 min)

### Via Studio UI

```
1. Settings → Studio → Models → Create
2. Name: x_project_collaborator
3. Display name: "Project Collaborator"
4. Create
5. Add fields:
   ✓ x_project_id (Many2one → x_projetos) - Project
   ✓ x_partner_id (Many2one → res.partner) - Partner
   ✓ x_user_id (Many2one → res.users) - User
   ✓ x_role (Char, 128) - Role (e.g. "Manager", "Contributor")
   
6. Save
```

**Verification**:
- [ ] Model exists

---

## Step 7: Add Phase 1 Fields to x_projetos (90 min)

Now add the 15 core fields to the x_projetos model.

### Via Studio UI: Edit x_projetos Model

```
1. Settings → Studio → Models → x_projetos (edit)
2. Click "Add Field" for each:

BASIC IDENTITY (4 fields):
   ✓ x_description (Html, 4) - Description
   ✓ x_active (Boolean, True) - Active
   ✓ x_sequence (Integer, 10) - Sequence
   ✓ x_color (Integer, 0) - Color Index

KEY RELATIONSHIPS (4 fields):
   ✓ x_partner_id (Many2one → res.partner) - Customer
   ✓ x_company_id (Many2one → res.company) - Company
   ✓ x_user_id (Many2one → res.users) - Project Manager
   ✓ x_account_id (Many2one → account.analytic.account) - Analytic Account

TIMELINE (2 fields):
   ✓ x_date_start (Date) - Start Date
   ✓ x_date (Date) - Completion Date

CONFIGURATION (5 fields):
   ✓ x_privacy_visibility (Selection) - Visibility [followers, invited_users, employees, portal]
   ✓ x_label_tasks (Char, 64) - Task Label (default: "Tasks")
   ✓ x_allow_task_dependencies (Boolean, False) - Allow Task Dependencies
   ✓ x_allow_milestones (Boolean, True) - Allow Milestones
   ✓ x_allow_recurring_tasks (Boolean, False) - Allow Recurring Tasks

3. Save all
```

**Verification Checklist**:
- [ ] All 15 fields added to x_projetos
- [ ] Fields appear in form view
- [ ] Fields are editable
- [ ] Many2one relationships work (can select customers, users, etc.)
- [ ] Selection fields have correct options

---

## Step 8: Configure Access Rules (60 min)

Set up basic IR.MODEL.ACCESS for each custom model.

### Via Studio UI

```
For each model (x_project_stage, x_project_task, x_project_milestone, 
x_project_update, x_project_tag, x_project_collaborator):

1. Settings → Technical → Record Rules
2. Create new rule:
   Name: <model_name> - Access
   Model: <model_name>
   Groups: All (or Employees if desired)
   Domain: [] (allow all)
   Permissions: Read, Write, Create, Delete (all checked)

3. Save
```

**Verification**:
- [ ] Each model has access rules
- [ ] Can create/edit records in Studio UI
- [ ] No permission errors when testing

---

## Acceptance Criteria: Phase 1 Complete

### ✅ Models Created
- [ ] x_project_stage exists with 3 default stages
- [ ] x_project_task exists with all fields
- [ ] x_project_milestone exists
- [ ] x_project_update exists
- [ ] x_project_tag exists
- [ ] x_project_collaborator exists

### ✅ Fields Added to x_projetos
- [ ] x_description (Html)
- [ ] x_active (Boolean)
- [ ] x_sequence (Integer)
- [ ] x_color (Integer)
- [ ] x_partner_id (M2O)
- [ ] x_company_id (M2O)
- [ ] x_user_id (M2O)
- [ ] x_account_id (M2O)
- [ ] x_date_start (Date)
- [ ] x_date (Date)
- [ ] x_privacy_visibility (Selection)
- [ ] x_label_tasks (Char)
- [ ] x_allow_task_dependencies (Boolean)
- [ ] x_allow_milestones (Boolean)
- [ ] x_allow_recurring_tasks (Boolean)

### ✅ Access Rules
- [ ] All 6 models have IR.MODEL.ACCESS rules
- [ ] Users can create/edit records

### ✅ Testing
- [ ] Can create a project with all 15 fields filled
- [ ] Can select customer, user, company
- [ ] Can create tasks, milestones, updates linked to project
- [ ] No errors in browser console (F12)

---

## Timeline

| Task | Duration | Owner |
|------|----------|-------|
| Step 1: Create x_project_stage | 30 min | UI Dev |
| Step 2: Create x_project_task | 45 min | UI Dev |
| Step 3: Create x_project_milestone | 30 min | UI Dev |
| Step 4: Create x_project_update | 30 min | UI Dev |
| Step 5: Create x_project_tag | 20 min | UI Dev |
| Step 6: Create x_project_collaborator | 30 min | UI Dev |
| Step 7: Add x_projetos fields | 90 min | UI Dev |
| Step 8: Configure access rules | 60 min | Backend Dev |
| **Total** | **~5.5 hours** | **Team** |

---

## Evidence & Documentation

After completing Phase 1, document:

1. **models_created.json** - List of all created models and fields
2. **access_rules.json** - All configured access rules
3. **Phase 1 Screenshot** - Studio models list showing all 6 new models
4. **Test Project** - Create a sample project with all fields populated

Save all to: `docs/logs/projetos_phase1_completed_<date>.json`

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Many2one relationship errors | Test each relationship after creation |
| Performance with many fields | Monitor Odoo form load time |
| Access rule conflicts | Keep rules simple, add complexity in Phase 2 |
| Typos in field names | Double-check names against plan before saving |

---

## Next Steps

Once Phase 1 is complete:
- ✅ Proceed to Phase 2: Create views (form, list, kanban, calendar, activity)
- ✅ Then Phase 3: Add automations and computed fields

**Ready to begin? Start with Step 1 above.**
