# Phase 2 Execution: Build Views and UX

**Date**: April 27, 2026  
**Status**: Ready for Manual Execution (After Phase 1)  
**Effort**: 5-7 hours  
**Prerequisites**: Phase 1 complete (all 6 models created, 15 fields added)

---

## Overview

Phase 2 involves creating 5 custom views for the x_projetos model and improving form design with all new Phase 1 fields.

**Views to Create**:
1. Form View - Complete project details
2. List View - Quick overview with filters
3. Kanban View - Grouped by stage
4. Calendar View - Timeline visualization
5. Activity View - Project update feed

---

## Step 1: Update Form View (60 min)

### Via Studio UI: Design Form

```
1. Go to Projetos model form view
2. Edit form layout
3. Organize fields into tabs/sections:

TAB: GENERAL
   ┌─────────────────────────────┐
   │ Name (x_name) [wide]        │
   │ Customer (x_partner_id)     │
   │ Project Manager (x_user_id) │
   └─────────────────────────────┘

TAB: DETAILS
   ┌─────────────────────────────┐
   │ Description (x_description) │
   │ Active (x_active)           │
   │ Color (x_color)             │
   │ Sequence (x_sequence)       │
   └─────────────────────────────┘

TAB: TIMELINE
   ┌─────────────────────────────┐
   │ Start Date (x_date_start)   │
   │ Completion Date (x_date)    │
   └─────────────────────────────┘

TAB: SETTINGS
   ┌─────────────────────────────┐
   │ Company (x_company_id)      │
   │ Analytic Account (x_account_id) │
   │ Visibility (x_privacy_visibility) │
   │ Label Tasks (x_label_tasks) │
   │ Allow Dependencies (x_allow_task_dependencies) │
   │ Allow Milestones (x_allow_milestones) │
   │ Allow Recurring (x_allow_recurring_tasks) │
   └─────────────────────────────┘

TAB: RELATED
   ┌─────────────────────────────┐
   │ Tasks (One2many → x_project_task) [list view] │
   │ Milestones (One2many → x_project_milestone) [list] │
   │ Updates (One2many → x_project_update) [list] │
   │ Tags (Many2many → x_project_tag) [tags] │
   └─────────────────────────────┘

4. Arrange fields for visual clarity
5. Save
```

**Verification**:
- [ ] Form displays all 15 Phase 1 fields
- [ ] Tabs are organized logically
- [ ] Related fields show count/preview
- [ ] No layout issues on mobile

---

## Step 2: Update List View (45 min)

### Via Studio UI: Configure Columns

```
1. Projetos model → List view (edit)
2. Configure visible columns:
   ✓ x_name (Name)
   ✓ x_partner_id (Customer)
   ✓ x_user_id (Project Manager)
   ✓ x_date_start (Start Date)
   ✓ x_date (Completion Date)
   ✓ x_active (Active)
   ✓ x_sequence (Sequence)

3. Add filters:
   ✓ Active (Boolean, default: True)
   ✓ Company (Many2one)
   ✓ Customer (Many2one)
   ✓ Project Manager (Many2one)

4. Add grouping options:
   ✓ Group by Company
   ✓ Group by Project Manager

5. Save
```

**Verification**:
- [ ] Can see all important project info in list
- [ ] Filters work correctly
- [ ] Grouping by user/company works

---

## Step 3: Create Kanban View (90 min)

### Via Studio UI: New Kanban View

```
1. Projetos model → Create new view
2. View type: Kanban
3. Name: x_projetos.kanban
4. Configuration:
   ✓ Group by: x_stage_id (if exists) or x_privacy_visibility
   ✓ Quick create: Enabled
   ✓ Card template:
     ┌──────────────────────┐
     │ Name: x_name         │
     │ Customer: x_partner  │
     │ Manager: x_user_id   │
     │ Dates: x_date_start→x_date
     │ Progress: %          │
     └──────────────────────┘
   
5. Add color gradient (optional):
   - Active: Green
   - Inactive: Gray
   - At Risk: Red

6. Save
```

**Verification**:
- [ ] Kanban view loads and displays cards
- [ ] Can drag cards between groups (if grouping supported)
- [ ] Can create new project directly from card
- [ ] Colors display correctly

---

## Step 4: Create Calendar View (75 min)

### Via Studio UI: New Calendar View

```
1. Projetos model → Create new view
2. View type: Calendar
3. Name: x_projetos.calendar
4. Configuration:
   ✓ Date start field: x_date_start
   ✓ Date end field: x_date
   ✓ Event title: x_name
   ✓ Color field: x_color
   ✓ Scale: Month/Week (user selectable)

5. Save
```

**Verification**:
- [ ] Calendar view loads
- [ ] Projects display as events on timeline
- [ ] Can see start and end dates
- [ ] Can click to edit project

---

## Step 5: Create Activity View (60 min)

### Via Studio UI: New Activity View for x_project_update

```
Alternative: Link to x_project_update model with activity display

Option A: Activity feed within form
1. Edit x_projetos form view
2. Add one2many field to x_project_update records
3. Display as timeline/activity format

Option B: Create separate x_project_activity model
1. Create x_project_activity model (if not done in Phase 1)
2. Create form view showing update history
3. Link updates in reverse chronological order

Recommended: Use x_project_update one2many with custom display
```

**Verification**:
- [ ] Can view project updates/activities
- [ ] Updates sorted by date (newest first)
- [ ] Can create new updates from activity view

---

## Step 6: Configure View Switching (30 min)

### Via Studio UI: Set Default Actions

```
1. Settings → Models → x_projetos
2. Default view order:
   1. Form (for single project editing)
   2. List (overview)
   3. Kanban (by stage)
   4. Calendar (timeline)
   5. Activity (updates)

3. Menu: Ensure all views accessible
   Settings → Menus → Projetos
   - Check that all view types listed

4. Save
```

**Verification**:
- [ ] Can switch between views using view switcher
- [ ] All 5 views accessible
- [ ] No errors when switching

---

## Acceptance Criteria: Phase 2 Complete

### ✅ Form View
- [ ] All Phase 1 fields displayed
- [ ] Organized into logical tabs
- [ ] Related models shown in tabs
- [ ] Mobile responsive

### ✅ List View
- [ ] Shows key columns (name, customer, manager, dates)
- [ ] Filters work
- [ ] Can sort by each column
- [ ] Performance acceptable

### ✅ Kanban View
- [ ] Displays projects as cards
- [ ] Can group by stage/visibility
- [ ] Can drag and drop (if supported)
- [ ] Quick create works

### ✅ Calendar View
- [ ] Shows project timeline
- [ ] Start and end dates visible
- [ ] Can navigate months/weeks
- [ ] Can click to edit

### ✅ Activity View
- [ ] Shows project updates in reverse chronological order
- [ ] Can create new updates
- [ ] Shows author and date

### ✅ View Switching
- [ ] All 5 views accessible
- [ ] No errors when switching
- [ ] Correct view is default (form)

---

## Timeline

| Task | Duration | Owner |
|------|----------|-------|
| Step 1: Update form view | 60 min | UI Dev |
| Step 2: Update list view | 45 min | UI Dev |
| Step 3: Create kanban view | 90 min | UI Dev |
| Step 4: Create calendar view | 75 min | UI Dev |
| Step 5: Create activity view | 60 min | UI Dev |
| Step 6: Configure view switching | 30 min | UI Dev |
| **Total** | **~5.5 hours** | **UI Dev** |

---

## Next Steps

After Phase 2:
- ✅ Proceed to Phase 3: Add automations, computed fields, and validation
- ✅ Execute full end-to-end testing
- ✅ Validate all gates pass

**Note**: If calendar or kanban views not supported in Studio, consider:
- Using pivot view as alternative
- Creating custom views via API (Phase 3)
- Accepting limited view options in MVP

---

## Known Limitations

- **Drag-drop**: May not be supported in all Studio versions
- **Computed columns**: May require custom development
- **Grouping**: Limited to existing fields
- **Color coding**: May need custom CSS
