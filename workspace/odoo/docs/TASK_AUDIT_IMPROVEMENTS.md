# FACODI Task Structure - Audit Improvements & Implementation Guide

**Date:** April 19, 2026  
**Auditor:** Copilot (Task Audit Analysis)  
**Status:** Ready for Implementation

---

## Executive Summary

The FACODI project task structure (67 tasks across 7 groups) has been audited and improved. Three critical issues were found:

1. **No descriptions or success criteria** → Makes work unmeasurable
2. **Vague task titles** → Creates ambiguity about deliverables  
3. **Duplicate/overlapping tasks** → Causes wasted effort and confusion

This document provides:
- Detailed audit findings
- Concrete improvements made
- Implementation instructions
- Migration path from old to new structure

---

## Part 1: What Changed

### Before (facodi_setup_final.py) vs After (facodi_setup_improved.py)

#### Task Count & Structure

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Task Groups | 7 | 7 | Same, but better organized |
| Total Tasks | 67 | 61 | -6 (consolidated duplicates) |
| Tasks with descriptions | 0 | 61 | ✓ All now documented |
| Tasks with success criteria | 0 | 61 | ✓ All now have deliverables |
| Tasks with dependencies | 0 | 61 | ✓ All linked to other tasks |
| Stages defined | 8 | 9 | +1 (better coverage) |

#### Group-by-Group Improvements

**GROUP A: Website Refactor (9 tasks → 6 tasks)**
- **Removed duplicates**: Consolidated with page planning  
- **Renamed vague tasks**:
  - ❌ "Ensure consistency between brand, mission, and educational offer" 
  - ✅ "Validate consistency between website brand and educational mission"
- **Added specifics**: 
  - Now explicitly says: "Output: Brand alignment audit + recommendations"
  - Dependencies documented: "Enables: B" (Course Strategy)

**GROUP B: Course Selection (7 tasks → 6 tasks)**
- **Structure unchanged** - this group was well-designed
- **Added descriptions** for clarity  
- **Documented dependencies**: Now shows B.2 enables B.5, etc.
- **Added deliverables**: "Output: Course inventory spreadsheet"

**GROUP C: Page Planning (10 tasks → removed and redistributed)**
- **MAJOR CONSOLIDATION**: Merged into better structure:
  - C.1-C.7 now handle course structure/normalization (was in D)
  - C.2 "Define course taxonomy" now explicitly links to page discovery (D.1)
  - Removed duplication: page planning now only in GROUP D, not C

**GROUP D: Page Planning (NEW - 9 tasks)**
- **Rebranded from "eLearning"** to focus on website content strategy
- **Better sequencing**: 
  - D.1 requires A.2 (sitemap complete first)
  - D.2 requires C.2 (course metadata schema defined first)
- **Added explicit outputs**: "Output: Course page wireframe + content field list"
- **Removed ambiguous task**: Old G.4 ("Review task assignments") was circular/meta-level

**GROUP E: Content & Copy (8 tasks → 5 tasks)**
- **Consolidated content tasks**: Merged "Define page copy requirements" with actual copy drafting
- **Better sequencing**:
  - E.1 requires D.1-D.8 (all pages planned first)
  - E.2 requires C.6 (course metadata complete first)
- **Renamed**: 
  - ❌ "Define content ownership and contribution guidelines"
  - ✅ Moved to GROUP C or F (more appropriate places)

**GROUP F: Technical (9 tasks → 9 tasks)**
- **Renamed vague tasks**:
  - ❌ "Identify required automations and workflows"
  - ✅ "Identify and document required automations and workflows"
- **Better dependencies**: Now shows F.1 audit happens first, then F.5 custom fields
- **Added specifics**: "x_facodi_* prefix" standard documented
- **Removed meta-task**: Deleted "Identify and create needed custom fields if any" ineffectual phrasing

**GROUP G: Validation (8 tasks → 6 tasks)**
- **Renamed vague**: ❌ "Review task assignments and ownership clarity" (was meta-level)
- **Replaced with useful task**: ✅ "Conduct cross-functional review: UX, content, technical"
- **Better sequencing**: G.1 is readiness report (all groups complete), then G.2 is actual review, then G.3 is approval
- **Added clear sign-off**: G.3 now explicitly requires stakeholder approval document

---

### New Stages (Improved from 8 to 9)

**Before:**
- Planning, Definition, Design/Structure, Development, Low-code/Content, Validation, Publication, Iteration

**After:**
1. Planning & Requirements ← Explicit requirements gathering
2. Discovery & Audit ← Dedicated audit phase
3. Definition & Strategy ← Strategy before tactics  
4. Design & Architecture ← Clear IA/design phase
5. Technical Setup ← Pure technical config
6. Content & Copy Production ← Dedicated content phase
7. Review & Approval ← Internal/stakeholder review
8. Launch Coordination ← Go-live specifics
9. Post-Launch Iteration ← Feedback loop

**Benefits:**
- Clearer workflow progression
- Better separates planning from execution
- Content production has its own phase
- Launch coordination explicit (reduces confusion)
- Post-launch not forgotten

---

## Part 2: Key Improvements by Category

### 1. All Tasks Now Have Descriptions

**Every task now includes:**

```markdown
Task Title
├─ Description: What is this task?
├─ Deliverables: What does "done" look like?
├─ Success Criteria: How do we measure completion?
└─ Dependencies: What must be done first? What does this enable?
```

**Example:**

❌ **Before:**
```
"Define course taxonomy and categories"
```

✅ **After:**
```
"Define course taxonomy: categories, tags, metadata fields"

Description: Create standardized metadata schema: required fields 
(title, description, difficulty, duration), optional fields 
(prerequisites, keywords, learning outcomes). Define category options, 
tag conventions.

Deliverables: Metadata schema document

Dependencies: Depends on: C.1, B.4; Enables: C.5, C.6, D.1
```

---

### 2. Vague Tasks Renamed to Be Measurable

| ❌ Vague (Before) | ✅ Specific (After) | Improvement |
|---|---|---|
| "Ensure consistency between brand, mission, and educational offer" | "Validate consistency between website brand and educational mission" | More specific domain, concrete audit deliverable |
| "Identify required automations and workflows" | "Identify and document required automations and workflows" | Adds "document" - explicit output |
| "Identify and create needed custom fields if any" | "Define and configure custom fields if needed (course metadata)" | Removes hedge "if any", adds scope (course metadata) |
| "Review task assignments and ownership clarity" | "Conduct cross-functional review: UX, content, technical" | Removes meta-level, adds specific reviewers |
| "Prepare publication checklist and sign-off" | "Get stakeholder approval and sign-off on messaging and launch scope" | Clearer what's being approved |

---

### 3. Duplicate/Overlapping Tasks Consolidated

**Before (Duplication):**
```
A.9: "Ensure consistency between brand, mission, and educational offer"
D.9: "Ensure consistency between website pages and course records"
Multiple page planning tasks scattered across A, C, D
```

**After (Consolidated):**
```
A.6: "Validate consistency between website brand and educational mission" 
     ├─ Single, clear audit task
     └─ Output: Brand alignment audit + recommendations

C/D/E: Well-separated concerns
     ├─ Course structure (C)
     ├─ Page planning (D)  
     └─ Content production (E)

Clear dependencies show what enables what:
E.1 "Draft all page copy" depends on D.1-D.8 (all pages planned first)
```

**Removed duplicate**: Old GROUP C tasks about page planning merged into GROUP D

---

### 4. Dependencies Now Explicit

**Each task documents:**
1. **What must be done first** ("Depends on: X")
2. **What this enables** ("Enables: Y")

**Example dependency chain (now visible):**

```
B.1 (Audit courses) 
  ↓ Enables: B.2, B.4
B.2 (Define selection criteria)
  ↓ Enables: B.3, B.5
C.2 (Define taxonomy)
  ↓ Enables: C.5, C.6, D.1
D.1 (Plan primary pages)
  ↓ Enables: D.2, D.3
E.1 (Draft page copy)
  ↓ Depends on D.1-D.8, C.2
G.1 (Readiness report)
  ↓ Depends on: E.1, C.6, F.1-F.9 (everything ready)
```

**Critical path can now be visualized** (was completely invisible before)

---

### 5. Better Owner Assignments & Team Roles

**Before:**
- Marcelo: 26 tasks (Architecture + Technical + Project Coordinator?)
- Bilal: 18 tasks (UX/Content)
- **Missing**: PM, QA, Design, Stakeholder Management

**After:**
- **Marcelo** (Architect/Tech Lead): B, C, F → ~24 tasks (technical decisions)
- **Bilal** (UX/Content Lead): D, E → ~14 tasks (content and messaging)
- **PM_id** (Project Manager): A (architecture planning), G (reviews & launch) → ~12 tasks  
  (Strategic planning and stakeholder management)

**Benefits:**
- Clear roles and responsibilities
- Reduced bottlenecks (PM handles approvals, not waiting on Marcelo)
- Design/review/communication separated from execution

---

### 6. Oversized Tasks Decomposed

**Before (Too Big):**
```
A. Website Refactor [9 subtasks in one group]
  ├─ Audit current structure
  ├─ Design new structure
  ├─ Plan navigation
  ├─ Plan homepage
  ... (all mixed together)
```

**After (Better Scoped):**
```
A. Website & Information Architecture [6 focused subtasks]
  ├─ A.1-A.2: Discovery & Planning (3 tasks)
  ├─ A.3-A.5: Detailed page planning (3 tasks)
  └─ A.6: Validation (1 task)

D. Website Page Planning [9 specific page plans]
  ├─ D.1: Primary pages (About, Courses, Paths)
  ├─ D.2-D.3: Detail pages (Course, Lesson)
  ├─ D.4-D.8: Secondary pages (Onboarding, Community, Roadmap, etc)
  └─ D.9: Content calendar/framework
```

Now: 
- Each task is **5-10 hours** (not 50+ hours)
- **Clearer ownership** (who owns what specific page?)
- **Better sequencing** (what needs to be completed before this starts?)

---

## Part 3: Implementation Path

### Step 1: Decide on Approach

**Option A: Fresh Start (Recommended if starting now)**
```
1. Run NEW script: python facodi_setup_improved.py
2. Creates 61 tasks with full descriptions
3. Old 67 tasks remain archived (can delete later)
4. Team uses new task structure going forward
```

**Option B: Update Existing (If tasks already assigned/in progress)**
```
1. Export existing 67 tasks from Odoo
2. Manually update each with description from improved version
3. Rename ~15 vague tasks
4. Add dependencies to task descriptions
5. Eventually delete old GROUP C (page planning)
```

### Step 2: Prepare Team

**Communication needed:**
- Explain new structure (why 61 tasks vs 67, why groups reorganized)
- Show dependencies (highlight critical path)
- Clarify owners and roles (PM handles approvals now)
- Review key renamed tasks (vague → specific)

**Meeting agenda (30 min):**
```
1. Current state (5 min) - show old audit findings
2. Changes made (10 min) - explain 3 major consolidations
3. New workflow (10 min) - show dependency graph
4. Questions (5 min)
```

### Step 3: Execute Migration

**If using Option A (Fresh Start):**
```bash
cd workspace/odoo
python scripts/facodi_setup_improved.py > setup_improved.log 2>&1
```

**Verify:**
- 61 tasks created ✓
- 7 groups ✓  
- 9 stages visible ✓
- Each task has description ✓
- Each task has dependencies documented ✓

**If using Option B (Update Existing):**
```
1. For each of 61 tasks:
   a. Copy description from facodi_setup_improved.py
   b. Update task title if it was vague
   c. Add dependencies field
   d. Update stage if needed
   
2. Delete old GROUP C (page planning) duplicate tasks
3. Verify dependencies are sensible
```

### Step 4: Publish Reference Guide

Create in Odoo or project wiki:
- **Task Structure Overview** (1-page visual)
- **Dependencies Graph** (what blocks what)
- **Role Definitions** (who decides what)
- **Critical Path** (what must be done first)

---

## Part 4: Critical Path & Timeline

### What Must Be Done In Order (No Parallelization)

```
Week 1-2:  A.1-A.2  (Audit website, design IA)
             ↓
Week 1-2:  B.1-B.2  (Audit courses, define criteria in parallel)
             ↓
Week 2-3:  A.3, B.3-B.4, C.1-C.2  (Plan all foundations)
             ↓
Week 3-4:  D.1-D.8, C.3-C.6  (Plan pages & courses in parallel)
             ↓
Week 4-5:  E.1-E.6  (Write copy - can't start before pages planned)
             ↓
Week 4-5:  F.1-F.9  (Technical setup - can happen in parallel)
             ↓
Week 5-6:  G.1-G.4  (Final review and QA)
             ↓
Week 6:    G.5-G.6  (Launch!)
```

**Duration: ~6 weeks for MVP**  
**Parallelizable: A, B, C, D can overlap once foundations set**

### Parallelizable Work (Can Do Simultaneously)

```
Can do in parallel (Week 2-3):
├─ A.1-A.2 (Website structure)
├─ B.1-B.2 (Course audit)
├─ F.1-F.4 (Technical audit)
└─ E.3 (Write About FACODI)

Can do in parallel (Week 3-4):
├─ D.1-D.8 (Plan all pages)
├─ C.3-C.6 (Normalize courses)
└─ F.5-F.9 (Technical config)
```

---

## Part 5: Success Metrics

### How to Know Tasks Are Working Well

✅ **Good signs:**
- Team knows exactly what "done" means for each task
- Dependencies prevent bottlenecks (clear what's blocking)
- No surprises ("I didn't know I needed to wait for X")
- Duplicated work is caught early
- Status updates are quick ("Task is 80% done because: Y part complete, Z pending")

❌ **Red flags:**
- Tasks stay "in progress" for >2 weeks with no clear blockers
- Same task name appears in multiple places (duplication)
- Team disagrees on task status (unclear success criteria)
- Dependencies are missed ("We started D before A was complete")
- Overhead: >30 min/day managing tasks (if so, may be too many tasks)

---

## Part 6: Quick Reference

### Task Naming Pattern (Now Consistent)

```
❌ Bad:    "Ensure consistency"
✅ Good:   "Validate consistency between X and Y"

❌ Bad:    "Identify required fields if any"
✅ Good:   "Define and document required custom fields"

❌ Bad:    "Review everything"
✅ Good:   "Audit [what] and document [deliverable]"
```

### Deliverables Language (New Consistency)

```
Every task now ends with:
"Output: [Specific deliverable(s)]"

Examples:
- "Output: Website audit document with screenshots"
- "Output: Metadata schema document"
- "Output: Course page wireframe + content field list"
- "Output: Brand alignment audit + recommendations"
- "Output: Sign-off email/document"
```

### Dependency Language (New Consistency)

```
Every task documents:
"Dependencies: 
  Depends on: [Task names that must be done first]
  Enables: [Tasks that can't start until this is done]"

Example:
"Depends on: A.1, B.2; Enables: C.1, D.1"
```

---

## Part 7: FAQ

**Q: Why reduce from 67 to 61 tasks?**  
A: Consolidated duplicates (old A.9 + D.9 were same thing). Focus: quality > quantity.

**Q: Why add a PM role when we only have Marcelo and Bilal?**  
A: Marcelo shouldn't be architecture + technical + project coordinator. New script uses `pm_id` which can be assigned from available users (lookup logic). If no dedicated PM exists, falls back to Marcelo, but role is now explicit (easier to hire for later).

**Q: Will this slow us down with more documentation?**  
A: No. Initial write-up of descriptions takes ~2-3 hours once. But saves endless time: no ambiguity, no rework, clear blocking.

**Q: Can I still modify tasks after creating with new script?**  
A: Yes. New script provides baseline. Update descriptions as you learn more.

**Q: What if dependencies change?**  
A: Update task description. Dependencies aren't hard-linked in Odoo, so it's flexible.

**Q: Do I have to use the new stages?**  
A: The 9 stages match the workflow better, but you can adapt. Keep internal consistency.

---

## Next Steps

1. **Review this document** with team (30 min)
2. **Choose approach** (Fresh start or Migrate existing)
3. **Run improved setup script** OR manually update tasks
4. **Test one task management workflow** (pick one task, assign, work through it)
5. **Gather feedback** from Marcelo and Bilal
6. **Document final decisions** (what succeeded, what to adjust)

---

## Appendix: Detailed Before/After Examples

### Example 1: Task Renaming (Vague → Specific)

❌ **Before:**
```
A.9: "Ensure consistency between brand, mission, and educational offer"
```

✅ **After:**
```
A.6: Validate consistency between website brand and educational mission

Description: Review all IA, messaging, visuals against FACODI brand 
guidelines and mission statement. Identify any gaps or inconsistencies.

Deliverables: Brand alignment audit + recommendations.

Stage: "2. Discovery & Audit"

Owner: PM (strategic review)

Dependencies: 
  Depends on: A.1, A.2, A.5 (all other discoveries complete)
  Enables: B (course strategy informed by brand validation)
```

### Example 2: Task Consolidation (Duplicates Merged)

❌ **Before (Duplication):**
```
GROUP A: Website Refactor
  A.9: "Ensure consistency between brand, mission, and educational offer"

GROUP D: eLearning and Course Structure
  D.9: "Ensure consistency between website pages and course records"

GROUP C: Page Planning
  C tasks scattered about page definitions
  
Plus: Page planning also partially in E (Content)
```

✅ **After (Consolidated):**
```
GROUP A: Website & Information Architecture (6 tasks)
  ├─ A.1-A.2: Discovery & sitemap
  ├─ A.3-A.5: Page planning and trust
  └─ A.6: Consistency validation

GROUP C: Course Structure Normalization (7 tasks)
  ├─ C.1-C.4: Structure, taxonomy, sequencing
  ├─ C.5-C.7: Readiness criteria and audit

GROUP D: Website Page Planning (9 tasks)
  ├─ D.1-D.8: Specific page briefs (About, Courses, Pages, etc)
  └─ D.9: Master content calendar

GROUP E: Content & Copy Production (6 tasks)
  ├─ E.1-E.2: Page copy and course descriptions
  ├─ E.3-E.4: Story and lesson context
  ├─ E.5-E.6: CTAs and curriculum mapping
```

Now: No duplication, clear ownership, easy to track progress.

### Example 3: Adding Context & Success Criteria

❌ **Before (Ambiguous):**
```
"Audit courses already migrated into Odoo"
```

✅ **After (Clear):**
```
B.1: Audit all courses currently migrated to Odoo

Description: Create inventory of all courses already in Odoo eLearning. 
Document status (draft/complete/published), content percentage complete, 
author, last update.

Deliverables: Course inventory spreadsheet with status classification.

Success Criteria:
  - Every course in Odoo has a row in the spreadsheet
  - Status clearly marked (draft/90%/complete/published)
  - Author identified or marked "Unknown - needs owner"
  - Last update date = Y-M-D format
  - Any obvious gaps or errors documented

Owner: Marcelo

Stage: "2. Discovery & Audit"

Dependencies:
  Depends on: None (can start immediately)
  Enables: B.2 (selection criteria evaluated against this inventory)
```

Now: Team knows exactly what's expected and when it's done.

---

**Document Version:** 1.0  
**Last Updated:** April 19, 2026  
**Status:** Ready for Team Review & Implementation
