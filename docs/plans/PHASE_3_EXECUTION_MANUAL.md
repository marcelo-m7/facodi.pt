# Phase 3 Execution: Automations, Computed Fields & Validation

**Date**: April 27, 2026  
**Status**: Ready for Implementation (After Phase 2)  
**Effort**: 5-6 hours  
**Prerequisites**: Phase 1 + 2 complete, all models and views created

---

## Overview

Phase 3 adds business logic, computed fields, automations, and comprehensive end-to-end validation.

**Deliverables**:
1. Computed fields for analytics (task counts, progress, etc.)
2. Studio automations for workflows
3. Validation rules for data integrity
4. End-to-end testing and evidence collection

---

## Part 1: Add Computed Fields (90 min)

These fields calculate dynamically based on related records.

### Via Python API or Studio Computed Fields

```
1. If available in Studio: Use "Computed Field" type
2. Otherwise: Create via Python model extension

FIELDS TO ADD:

Analytics:
  ✓ x_task_count - Count of all tasks
  ✓ x_open_task_count - Count of open (not Done) tasks
  ✓ x_closed_task_count - Count of Done tasks
  ✓ x_collaborator_count - Count of team members
  ✓ x_milestone_count - Count of milestones
  ✓ x_update_count - Count of updates

Progress:
  ✓ x_task_completion_percentage - % of tasks done
  ✓ x_milestone_progress - % of milestones reached
  ✓ x_next_milestone_id - Next upcoming milestone

Status:
  ✓ x_last_update_id - Most recent update
  ✓ x_last_update_status - Status of last update
  ✓ x_days_until_completion - Days until x_date
```

**Implementation Options**:

Option A: Studio Computed Field UI (if available)
```
For each field:
1. Edit x_projetos model
2. Add field → Type: Computed
3. Define formula/logic
4. Save
```

Option B: Python (@api.depends decorator)
```python
# In addon/codoo or via custom model extension
@api.depends('task_ids', 'task_ids.stage_id')
def _compute_task_count(self):
    for project in self:
        project.x_task_count = len(project.x_task_ids)
        project.x_open_task_count = len(
            project.x_task_ids.filtered(lambda t: t.x_status != 'Done')
        )
        project.x_closed_task_count = len(
            project.x_task_ids.filtered(lambda t: t.x_status == 'Done')
        )
```

---

## Part 2: Create Studio Automations (90 min)

Automate common workflows and enforce business rules.

### Automation 1: Auto-update Project Status

```
Trigger: On Change of task stage
Condition: Project exists AND has tasks
Action:
  1. Count open vs closed tasks
  2. If all tasks closed → Mark project as 80% complete
  3. If all milestones reached → Mark as 100% complete
```

### Automation 2: Create Update on Status Change

```
Trigger: On Create/Change of x_project_update
Condition: Update has status
Action:
  1. Create activity log entry
  2. Notify project manager
  3. Update last_update_id on project
```

### Automation 3: Task Default Assignment

```
Trigger: On Create of x_project_task
Condition: No assigned user yet
Action:
  1. Assign to project manager (x_user_id)
  2. Set default stage (first stage in x_project_stage)
```

### Automation 4: Milestone Completion Check

```
Trigger: On Change of x_project_milestone.x_reached
Condition: Reached = True
Action:
  1. Create update record
  2. Notify stakeholders
  3. Recalculate x_milestone_progress
```

### Via Studio UI

```
1. Settings → Automation Rules (or Studio Automation)
2. For each automation above:
   a. Create new rule
   b. Set trigger (on create, on update, on field change)
   c. Set conditions (if any)
   d. Set actions (update field, create record, send notification)
   e. Save

3. Test each rule with sample data
```

---

## Part 3: Add Validation Rules (60 min)

Enforce data integrity and prevent invalid states.

### Rule 1: Date Validation

```
Field: x_date (Completion Date)
Rule: Must be >= x_date_start (if start date exists)
Action: Show error "End date must be after start date"
```

### Rule 2: Required Fields

```
Fields that must not be empty:
  ✓ x_name (Project name)
  ✓ x_partner_id (Customer, if required by business rule)
  ✓ x_user_id (Project manager)
```

### Rule 3: Task Stage Constraint

```
Rule: Task stage must be from same project's stage list
Implementation: One2many relationship with domain filter
```

### Via Studio UI

```
1. Edit x_projetos form
2. For each field:
   a. Click field → Advanced
   b. Set "Required" or "Readonly" as needed
   c. Add custom validation message
   
3. Test validation with invalid data
```

---

## Part 4: End-to-End Testing (90 min)

Comprehensive testing of all features and gates.

### Test Case 1: Create Complete Project

```
1. Click "Create" on Projetos list
2. Fill form:
   ✓ Name: "Client Website Redesign"
   ✓ Customer: Select existing customer
   ✓ Manager: Select employee
   ✓ Start: 2026-04-28
   ✓ Completion: 2026-06-30
   ✓ Description: "Full website redesign with new branding"
   ✓ Allow Milestones: Yes
   ✓ Allow Dependencies: Yes
   
3. Save project
4. Verify:
   ✓ Project created with ID
   ✓ All fields saved correctly
   ✓ Can edit immediately
   ✓ No errors in console (F12)
```

### Test Case 2: Add Related Records

```
1. Open project
2. In "Related" tab:
   a. Create task:
      - Name: "Design homepage"
      - Assign to manager
      - Set deadline
      - Save
   
   b. Create milestone:
      - Name: "Design Phase Complete"
      - Target: 2026-05-15
      - Save
   
   c. Create tag and assign
   
   d. Add collaborator
      - Partner/User
      - Role: Designer
   
3. Verify:
   ✓ All related records created
   ✓ Task counts update (x_task_count = 1)
   ✓ Milestone count updates
   ✓ Collaborator visible in list
```

### Test Case 3: Workflow Transitions

```
1. Open task in related section
2. Change status: New → In Progress
3. Verify automation triggers:
   ✓ Task stage updates
   ✓ Project update created (if automation exists)
   ✓ Activity logged

4. Complete task: Change to Done
5. Verify:
   ✓ x_open_task_count decreases
   ✓ x_closed_task_count increases
   ✓ x_task_completion_percentage updates
```

### Test Case 4: UI Rendering

```
1. Open form view → No errors
2. Switch to list view → All columns display
3. Switch to kanban → Cards display correctly
4. Switch to calendar → Timeline shows correctly
5. Switch to activity → Updates show in order

Verify on:
   ✓ Desktop browser (1920x1080)
   ✓ Tablet (768x1024)
   ✓ Mobile (375x667)
   ✓ All browsers (Chrome, Firefox, Safari)
```

### Test Case 5: Permissions & Security

```
1. Create access groups (if custom):
   ✓ Managers: Full access
   ✓ Employees: Read/write own projects
   ✓ Guests: Read-only

2. Test each role:
   a. Attempt create → Success/Denied as expected
   b. Attempt edit others' projects → Success/Denied
   c. Attempt delete → Success/Denied

3. Verify computed fields visible to all roles
```

### Test Case 6: Performance

```
1. Create 10 projects with 100 tasks each
2. Load list view
3. Verify:
   ✓ List loads in < 3 seconds
   ✓ No timeout errors
   ✓ Switching views is responsive
   ✓ Filters/search work quickly

4. Open single project
5. Verify:
   ✓ Form loads in < 2 seconds
   ✓ Related tabs load quickly
   ✓ Computed fields calculate correctly
```

---

## Part 5: Generate Evidence Logs (30 min)

Document all testing results for compliance.

### Evidence Files to Create

```
1. test_results.json
   {
     "timestamp": "2026-04-27T...",
     "phase": 3,
     "test_cases": [
       {
         "name": "Create Complete Project",
         "status": "PASS",
         "steps_completed": 4,
         "errors": []
       },
       ...
     ],
     "summary": "All 6 test cases passed"
   }

2. performance_report.json
   {
     "form_load_time_ms": 1500,
     "list_load_time_ms": 2100,
     "kanban_load_time_ms": 1800,
     "max_acceptable_ms": 3000,
     "status": "PASS"
   }

3. browser_console_logs.json
   {
     "errors": [],
     "warnings": [],
     "info_messages": ["Project created successfully"],
     "js_errors_found": false
   }

4. validation_gates_result.json
   {
     "install_gate": "PASS",
     "api_crud_gate": "PASS",
     "ui_interaction_gate": "PASS",
     "permissions_gate": "PASS",
     "performance_gate": "PASS",
     "console_errors_gate": "PASS",
     "all_gates_passed": true
   }
```

Save to: `docs/logs/projetos_phase3_complete_<date>.json`

---

## Acceptance Criteria: Phase 3 Complete

### ✅ Computed Fields
- [ ] All 10 computed fields created
- [ ] Fields calculate correctly
- [ ] Update when related records change

### ✅ Automations
- [ ] At least 3 automations implemented
- [ ] Automations trigger on correct events
- [ ] No infinite loops or recursion

### ✅ Validations
- [ ] Date validation enforced
- [ ] Required fields marked
- [ ] Custom validation messages display

### ✅ Testing
- [ ] All 6 test cases passed
- [ ] No JavaScript console errors
- [ ] Performance acceptable (< 3s loads)
- [ ] Mobile responsive

### ✅ Documentation
- [ ] Evidence logs saved to docs/logs/
- [ ] Test results documented
- [ ] Known limitations listed

---

## Final Validation Gates (Codoo Protocol)

```
Gate 1: Install ✓
  - x_projetos model exists and is functional

Gate 2: API CRUD ✓
  - Can create, read, update, delete projects via API
  - All fields persist correctly

Gate 3: UI Interaction ✓
  - Can create/edit projects in UI
  - All views render without errors
  - Navigation works

Gate 4: Browser Console ✓
  - No JavaScript errors
  - No 404 or 500 errors
  - Warnings only (if any)

Gate 5: Permissions ✓
  - Access rules enforced
  - Cannot create if denied
  - Record rules work correctly

Gate 6: Performance ✓
  - Form loads < 2s
  - List loads < 3s
  - No timeout errors

Gate 7: Relationships ✓
  - Can link projects to partners, users, tasks
  - Reverse relationships work
  - Counts update correctly

Gate 8: Automation ✓
  - Automations trigger on events
  - Updates cascade correctly
  - No data loss
```

---

## Timeline

| Task | Duration | Owner |
|------|----------|-------|
| Add computed fields | 90 min | Backend Dev |
| Create automations | 90 min | UI Dev |
| Add validation rules | 60 min | UI Dev |
| End-to-end testing | 90 min | QA |
| Generate evidence | 30 min | QA |
| **Total** | **~5.5 hours** | **Team** |

---

## Success Criteria

✅ **All 8 Codoo gates passing**
✅ **All 6 test cases passed**
✅ **Evidence logs generated and saved**
✅ **Documentation complete**
✅ **No console errors**
✅ **Performance acceptable**
✅ **Permissions enforced**
✅ **Relationships working**

---

## Go/No-Go Decision

**Ready for Production?**

- [ ] All 3 phases complete
- [ ] All tests passing
- [ ] Evidence collected
- [ ] Performance acceptable
- [ ] No known bugs
- [ ] Users trained

**If YES**: Deploy to production, update documentation
**If NO**: Document blockers, plan remediation, retry

---

**Prepared by**: AI Implementation Agent  
**Date**: April 27, 2026  
**Status**: Ready for execution upon Phase 2 completion
