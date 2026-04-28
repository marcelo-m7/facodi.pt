#!/usr/bin/env python3
"""
FACODI Setup v2 - IMPROVED with descriptions, better naming, merged duplicates, and dependencies.

Improvements over facodi_setup_final.py:
1. All tasks now have descriptions and success criteria
2. Vague tasks renamed to be measurable
3. Duplicate tasks merged and consolidated
4. Clear dependencies documented
5. Better stage definitions
6. More balanced owner assignments (added Project Manager role)
7. Decomposed oversized tasks

Run with: python workspace/odoo/scripts/facodi_setup_improved.py > output.log 2>&1
"""
import os, sys, json
from pathlib import Path

# Suppress SSL warnings
os.environ.pop("SSLKEYLOGFILE", None)

# Add workspace to path
workspace_odoo_dir = Path(__file__).parent
sys.path.insert(0, str(workspace_odoo_dir))

# Import the client
from odoo_test_utils import load_env, get_odoo_credentials, OdooClient

# Load credentials
workspace_root = workspace_odoo_dir.parent
project_root = workspace_root.parent
load_env(workspace_root=workspace_root, project_root=project_root)
host, db, user, passwd =  get_odoo_credentials()

# Create client
client = OdooClient(host, db, user, passwd)
uid = client.authenticate()

print(f"✓ Connected to {host}/{db} as UID {uid}\n")

# ─────────────────────────────────────────────────────────────────────────────
# SETUP WITH FULL DESCRIPTIONS AND IMPROVED STRUCTURE
# ─────────────────────────────────────────────────────────────────────────────

# 1. Get or create FACODI project
print("1. Create/verify FACODI project...")
proj_name = "FACODI — Digital Platform"
existing = client.execute("project.project", "search_read",
    [[("name", "=", proj_name)]],
    {"fields": ["id"]}
)
proj_id = existing[0]["id"] if existing else client.execute("project.project", "create",
    [{"name": proj_name, "privacy_visibility": "employees"}]
)
print(f"   Project ID: {proj_id}\n")

# 2. Get users
print("2. Lookup users...")
users = client.execute("res.users", "search_read", [[("id", ">", 0)]], 
    {"fields": ["id", "name"], "limit": 100}
)
marcelo_id = next((u["id"] for u in users if "marcelo" in u["name"].lower()), 2)
bilal_id = next((u["id"] for u in users if "bilal" in u["name"].lower()), marcelo_id)

# Try to find a PM or use marcelo as fallback
pm_id = next((u["id"] for u in users if any(title in u["name"].lower() for title in ["pm", "manager", "product"])), marcelo_id)

print(f"   Marcelo (Architect/Tech): {marcelo_id}")
print(f"   Bilal (UX/Content Lead): {bilal_id}")
print(f"   PM/Coordinator: {pm_id}\n")

# 3. Create improved stages
print("3. Create project stages...")
stages = [
    ("1. Planning & Requirements", 10),
    ("2. Discovery & Audit", 20),
    ("3. Definition & Strategy", 30),
    ("4. Design & Architecture", 40),
    ("5. Technical Setup", 50),
    ("6. Content & Copy Production", 60),
    ("7. Review & Approval", 70),
    ("8. Launch Coordination", 80),
    ("9. Post-Launch Iteration", 90),
]
stage_ids = {}
for name, seq in stages:
    existing_stage = client.execute("project.task.type", "search_read",
        [[("name", "=", name), ("project_ids", "in", [proj_id])]],
        {"fields": ["id"]}
    )
    sid = existing_stage[0]["id"] if existing_stage else client.execute(
        "project.task.type", "create",
        [{"name": name, "sequence": seq, "project_ids": [[4, proj_id]]}]
    )
    stage_ids[name] = sid
    print(f"   {name}: {sid}")
print()

# 4. Define improved task structure with descriptions
# Format: (group_name, owner_id, stage_name, description, [(subtask_name, description, dependencies), ...])

task_groups_data = [
    # ─────────────────────────────────────────────────────────────────────────
    # GROUP A: WEBSITE & CONTENT ARCHITECTURE (formerly A + C partially)
    # ─────────────────────────────────────────────────────────────────────────
    ("A. Website & Information Architecture", pm_id, "2. Discovery & Audit",
        "Discovery and planning of website structure, sitemap, and information architecture to align with FACODI mission and course offering.",
        [
            ("A.1. Audit current website structure and navigation", 
             "Analyze existing website pages, hierarchy, flows, and user journeys. Document all pages, entry points, and current navigation patterns. Output: Website audit document with screenshots, flow diagrams, and findings document.",
             "None"),
            ("A.2. Define target information architecture and sitemap",
             "Create new IA diagram with primary navigation, secondary pages, and content hierarchy. Define 3-5 user journeys (Learner, Educator, Contributor). Output: IA diagram + sitemap document + user journey flows.",
             "Depends on: A.1"),
            ("A.3. Plan homepage: objective, audience, CTA",
             "Define homepage purpose, primary audience segment, key messaging, main CTA. Identify hero image/section, feature sections, secondary CTAs. Output: Approved homepage brief (1 page) with wireframe sketch.",
             "Depends on: A.2; Enables: C.1"),
            ("A.4. Define relationship between website and Odoo eLearning",
             "Decide what content lives on website vs Odoo. Define discovery flow: website → Odoo course enrollment. Identify data syncing needs. Output: Decision document + data sync requirements list.",
             "Depends on: A.2; Enables: D, F"),
            ("A.5. Define footer, trust section, and partnership areas",
             "Plan footer content, social links, trust signals (accreditation, partners, testimonials if any). Define 'About FACODI' section. Output: Footer content outline + partner/trust criteria document.",
             "Depends on: A.2"),
            ("A.6. Validate consistency between website brand and educational mission",
             "Review all IA, messaging, visuals against FACODI brand guidelines and mission statement. Identify any gaps or inconsistencies. Output: Brand alignment audit + recommendations.",
             "Depends on: A.1, A.2, A.5; Enables: B"),
        ]
    ),
    
    # ─────────────────────────────────────────────────────────────────────────
    # GROUP B: COURSE STRATEGY & SELECTION
    # ─────────────────────────────────────────────────────────────────────────
    ("B. Course Portfolio Strategy & Selection", marcelo_id, "3. Definition & Strategy",
        "Define course portfolio, selection criteria, and roadmap for MVP and future phases.",
        [
            ("B.1. Audit all courses currently migrated to Odoo",
             "Create inventory of all courses already in Odoo eLearning. Document status (draft/complete/published), content percentage complete, author, last update. Output: Course inventory spreadsheet with status classification.",
             "None"),
            ("B.2. Define course selection and prioritization criteria",
             "Create rubric for course inclusion: alignment with mission, availability of materials, curriculum completeness, demand. Score existing and candidate courses. Output: Scoring rubric + scored course list.",
             "Depends on: B.1"),
            ("B.3. Identify next priority courses to migrate (Wave 2)",
             "Using criteria from B.2, select 3-5 priority courses for post-MVP phase. Document rationale. Output: Priority course list with justification.",
             "Depends on: B.2"),
            ("B.4. Group courses by learning path or discipline category",
             "Organize courses into logical learning paths or discipline clusters (e.g., 'Math Foundations', 'Natural Sciences', 'Humanities'). Output: Course taxonomy/structure diagram.",
             "Depends on: B.2"),
            ("B.5. Define MVP course set and public readiness criteria",
             "Select 1-3 courses for MVP launch. Define 'public-ready' checklist: metadata complete, descriptions polished, at least 30% content materials linked. Output: MVP course list + readiness checklist.",
             "Depends on: B.2, B.4"),
            ("B.6. Map courses to website discover page and filtering structure",
             "Define how courses appear on website: category filters, search fields, sort options, preview capabilities. Output: Course discovery page wireframe + filter/sort specifications.",
             "Depends on: B.4, A.2"),
        ]
    ),

    # ─────────────────────────────────────────────────────────────────────────
    # GROUP C: COURSE STRUCTURE & CONTENT NORMALIZATION
    # ─────────────────────────────────────────────────────────────────────────
    ("C. Course Structure Normalization & Taxonomy", marcelo_id, "4. Design & Architecture",
        "Define and normalize eLearning course structure, taxonomy, metadata, and publication readiness.",
        [
            ("C.1. Validate and normalize current eLearning structure in Odoo",
             "Audit current course/slide hierarchy in Odoo. Verify naming consistency, structure patterns, and metadata fields. Document deviations from standard. Output: Normalization checklist + any required structure corrections.",
             "Depends on: B.1"),
            ("C.2. Define course taxonomy: categories, tags, metadata fields",
             "Create standardized metadata schema: required fields (title, description, difficulty, duration), optional fields (prerequisites, keywords, learning outcomes). Define category options, tag conventions. Output: Metadata schema document.",
             "Depends on: C.1, B.4"),
            ("C.3. Define learning path structure and sequencing rules",
             "Specify how lessons/modules must be organized: linear sequence vs choice-based, prerequisite rules if any, branching logic. Output: Learning design guidelines document.",
             "Depends on: C.2"),
            ("C.4. Specify lesson/content ordering and section dependencies",
             "For each course lesson structure: define if sequential (must complete L1 before L2) or flexible. Document any hard requirements. Output: Course sequencing rules per course type.",
             "Depends on: C.3"),
            ("C.5. Define publication readiness and visibility rules",
             "Create publication checklist: metadata complete, all fields translated/polished, materials linked, instructional design reviewed. Define who can publish (staff only? instructors?). Output: Publication workflow + approval matrix.",
             "Depends on: C.2, B.5"),
            ("C.6. Audit all courses and complete missing metadata",
             "Against schema from C.2: ensure every course has description, duration estimate, difficulty level, learning outcomes drafted. Fill gaps or flag for author action. Output: Metadata completion status report.",
             "Depends on: C.2, C.5"),
            ("C.7. Audit and link all course materials (YouTube playlists, references)",
             "For each course: verify YouTube playlists are linked, descriptions updated, any external resources documented. Output: Material audit report with live link verification.",
             "Depends on: C.6"),
        ]
    ),

    # ─────────────────────────────────────────────────────────────────────────
    # GROUP D: WEBSITE PAGE PLANNING & CONTENT STRATEGY
    # ─────────────────────────────────────────────────────────────────────────
    ("D. Website Page Planning & Content Brief", bilal_id, "4. Design & Architecture",
        "Plan all website pages, content structure, messaging, and copy requirements.",
        [
            ("D.1. Plan primary pages: About, Courses Discovery, Learning Paths",
             "For each page: define purpose, primary CTA, content sections, information hierarchy. Create wireframes. Output: Page design brief + wireframes for 3 primary pages.",
             "Depends on: A.2, B.4"),
            ("D.2. Plan course detail page template and content structure",
             "Design single-course page: course meta (duration, difficulty, category), description, learning outcomes, materials list, enrollment CTA, related courses. Output: Course page wireframe + content field list.",
             "Depends on: C.2, D.1"),
            ("D.3. Plan lesson/content page template and learning context",
             "Design lesson page when inside a course: breadcrumbs, lesson title, learning outcomes, content, progress indicator, next lesson CTA. Output: Lesson page wireframe + interactive elements spec.",
             "Depends on: D.2, C.3"),
            ("D.4. Plan 'Get Started' / Onboarding page if needed",
             "If needed: explain what FACODI is, who it's for, how to explore courses. Create decision: needed or combine with homepage? Output: Onboarding page brief (or decision to exclude).",
             "Depends on: A.3"),
            ("D.5. Plan 'Community' or 'Contribute' page (optional for MVP)",
             "If in scope: how can users suggest materials, connect with others, contribute? Or defer to Phase 2. Output: Decision + brief (if included).",
             "None"),
            ("D.6. Plan 'Roadmap / Transparency' page content and update cadence",
             "Public roadmap: show planned courses, community voting (if any), transparency on development. Define update frequency (monthly? quarterly?). Output: Roadmap page brief + maintenance plan.",
             "Depends on: B.3"),
            ("D.7. Plan 'Contact & Support' page with support workflows",
             "Contact form, support email, FAQ if any, links to community. Define who receives inquiries, response SLA. Output: Support page brief + email routing rules.",
             "None"),
            ("D.8. Plan meta pages: FAQ, Accessibility, Privacy, Terms",
             "Define what meta pages are essential for launch vs Phase 2. (Legal/Privacy typically required; FAQ/Accessibility recommended). Output: Meta page checklist + required content outlines.",
             "Depends on: A.6"),
            ("D.9. Create master content calendar and messaging framework",
             "Central document: messaging pillars, tone of voice, key messaging points, content themes for 6 months. Ensure consistency across all copy. Output: Brand messaging guide + 6-month content calendar.",
             "Depends on: A.6, D.1-D.8"),
        ]
    ),

    # ─────────────────────────────────────────────────────────────────────────
    # GROUP E: CONTENT & COPY PRODUCTION
    # ─────────────────────────────────────────────────────────────────────────
    ("E. Content & Copy Production", bilal_id, "6. Content & Copy Production",
        "Draft and refine all website copy, course descriptions, and messaging.",
        [
            ("E.1. Draft all page copy per content briefs (D)",
             "For each page (About, Courses, Learning Paths, etc): write compelling, clear, benefit-oriented copy. Target 1-2 pages per page usually. Output: Draft copy document for all pages.",
             "Depends on: D.1-D.8"),
            ("E.2. Complete and polish all course descriptions",
             "For each course: write compelling 1-2 paragraph description, learning outcomes (3-5 bullets), target audience, prerequisites if any. Ensure consistency. Output: Curated course descriptions file.",
             "Depends on: C.6, E.1"),
            ("E.3. Draft 'About FACODI' story and institutional context",
             "Who founded FACODI? Why? What's the story? Institutional mission alignment. Should feel authentic and inspiring. Output: About FACODI section (500-800 words) + tone guidelines.",
             "Depends on: A.6"),
            ("E.4. Create lesson/content page intro copy and learning scaffolding text",
             "For lesson pages: intro paragraph explaining what will be learned, why it matters, how to use the materials. Output: Lesson template intro copy (with variables for course/lesson names).",
             "Depends on: D.3"),
            ("E.5. Write CTA copy and call-to-action hierarchy",
             "Primary CTA (Explore Courses/Enroll), secondary CTAs (Learn More, View Roadmap), tertiary (footer links). Ensure consistent, compelling language. Output: CTA copy guide with placement rules.",
             "Depends on: D.9"),
            ("E.6. Audit and complete course institutional context (degree program, UC mapping)",
             "For each course/UC: add which degree program(s) it belongs to, semester/sequence position. Ensure all curriculum mappings are current. Output: Curriculum mapping audit + any updates.",
             "Depends on: C.6, B.4"),
        ]
    ),

    # ─────────────────────────────────────────────────────────────────────────
    # GROUP F: TECHNICAL & ODOO CONFIGURATION
    # ─────────────────────────────────────────────────────────────────────────
    ("F. Technical Infrastructure & Odoo Configuration", marcelo_id, "5. Technical Setup",
        "Verify Odoo modules, permissions, custom fields, automations, and technical integration points.",
        [
            ("F.1. Audit installed Odoo modules relevant to FACODI",
             "Verify eLearning (slide module), Website, CRM, Project are installed and functional. Document versions. Output: Module audit report.",
             "None"),
            ("F.2. Verify project management setup and access control",
             "Confirm project spaces created, teams assigned, permissions set (who can create/edit/publish). Output: Project access control document.",
             "None"),
            ("F.3. Verify website module integration with course catalog",
             "Ensure website can display Odoo courses, categories, and filters. Test course detail page template integration. Output: Website-Odoo integration test report.",
             "Depends on: B.1, C.1"),
            ("F.4. Verify eLearning/slide module setup: categories, fields, workflows",
             "Confirm slide channel/slide model configuration, visibility rules, enrollments working. Test learner experience. Output: eLearning module setup verification checklist.",
             "Depends on: C.1"),
            ("F.5. Define and configure custom fields if needed (course metadata)",
             "If metadata schema (C.2) requires fields not in standard Odoo: create custom fields (x_facodi_* prefix). Document all custom fields. Output: Custom fields documentation.",
             "Depends on: C.2"),
            ("F.6. Identify and document required automations and workflows",
             "Auto-publish courses when complete? Auto-notify instructors? Sync material changes? Document what automations are needed and feasibility. Output: Automation requirements document.",
             "Depends on: C.5"),
            ("F.7. Audit scalability: storage, permissions model, reporting structure",
             "Confirm infrastructure can handle expected course volume, users, and concurrent sessions. Document any risks (scale limits, backup frequency, etc). Output: Infrastructure audit + risk register.",
             "None"),
            ("F.8. Verify content sync pipeline: data consistency between website and Odoo",
             "Confirm any automated or manual data syncing works: course updates, metadata changes, material links. Output: Data sync verification checklist.",
             "Depends on: A.4, C.6"),
            ("F.9. Plan post-launch monitoring, metrics, and support ticketing",
             "Define what metrics to monitor (course engagement, enrollment, errors), support ticket workflow, SLA for response. Output: Monitoring and support plan document.",
             "None"),
        ]
    ),

    # ─────────────────────────────────────────────────────────────────────────
    # GROUP G: REVIEW, APPROVAL & LAUNCH COORDINATION
    # ─────────────────────────────────────────────────────────────────────────
    ("G. Review, Approval & Launch Coordination", pm_id, "7. Review & Approval",
        "Final review of all deliverables, stakeholder approval, and launch readiness.",
        [
            ("G.1. Compile completeness report: all pages, courses, technical readiness",
             "Review checklist: all pages completed? All courses have metadata and materials? All dependencies resolved? Output: Launch readiness report (Go/No-Go assessment).",
             "Depends on: E.1, C.6, F.1-F.9"),
            ("G.2. Conduct cross-functional review: UX, content, technical, product fit",
             "Walkthrough by team: Bilal (content), Marcelo (technical), PM (product fit). Identify final issues, polish needs. Output: Final review summary + issues log.",
             "Depends on: G.1"),
            ("G.3. Get stakeholder approval and sign-off on messaging and launch scope",
             "Present to leadership/stakeholders for final approval of course selection, messaging tone, go-live scope. Output: Sign-off email/document.",
             "Depends on: G.2"),
            ("G.4. Prepare publication checklist and final QA testing",
             "Final checklist before launch: links verified, SEO basics checked, mobile tested, all CTAs working, error pages handled. Conduct final regression test. Output: Pre-launch QA report.",
             "Depends on: G.2"),
            ("G.5. Coordinate launch timing and success metrics",
             "Decide launch date, any phased rollout, success metrics for first week (traffic, enrollments, error rate). Brief support team. Output: Launch plan + success criteria document.",
             "Depends on: G.3"),
            ("G.6. Document post-launch support and iteration roadmap",
             "Plan for first 2 weeks post-launch: bug fixes, quick improvements, community feedback collection. Early feature requests (Phase 2) documented. Output: Post-launch support plan + Phase 2 ideas backlog.",
             "Depends on: G.5"),
        ]
    ),
]

# 5. Create task groups with full descriptions
print("4. Create task groups and subtasks with descriptions...")
total_created = 0
task_groups_created = []

for group_name, owner_id, stage_name, group_desc, subtasks in task_groups_data:
    stage_id = stage_ids[stage_name]
    
    # Create parent task with description
    parent_id = client.execute("project.task", "create", [{
        "name": group_name,
        "description": group_desc,
        "project_id": proj_id,
        "stage_id": stage_id,
        "user_id": owner_id,
    }])
    total_created += 1
    print(f"   {group_name} [{parent_id}]")
    
    # Create subtasks with descriptions and dependencies
    for i, (sub_name, sub_desc, dependencies) in enumerate(subtasks, 1):
        full_name = f"{i}. {sub_name}"
        full_desc = f"{sub_desc}\n\n---\n**Dependencies:** {dependencies}"
        
        sub_id = client.execute("project.task", "create", [{
            "name": full_name,
            "description": full_desc,
            "project_id": proj_id,
            "stage_id": stage_id,
            "user_id": owner_id,
            "parent_id": parent_id,
        }])
        total_created += 1
    
    task_groups_created.append({
        "name": group_name,
        "id": parent_id,
        "owner": owner_id,
        "stage": stage_name,
        "subtask_count": len(subtasks)
    })

print(f"\n✓ Total tasks created: {total_created}\n")

# 6. Save results
result = {
    "status": "success",
    "version": "2.0 - Improved with descriptions and dependencies",
    "project_id": proj_id,
    "stage_count": len(stage_ids),
    "task_groups": task_groups_created,
    "total_tasks": total_created,
    "improvements": [
        "Added full descriptions and success criteria to all tasks",
        "Merged duplicate tasks (A+C consolidated into A & D)",
        "Renamed vague tasks to be measurable and specific",
        "Added explicit dependencies in task descriptions",
        "Created better workflow stages aligned to actual work",
        "Balanced owner assignments with PM role",
        "Decomposed oversized tasks (Website Refactor, Page Planning)",
        "Removed meta-task (task reviewing tasks)",
        "Added clear deliverables for each task",
    ]
}

output_file = workspace_odoo_dir / "FACODI_SETUP_IMPROVED_RESULT.json"
with open(output_file, "w") as f:
    json.dump(result, f, indent=2, default=str)

print(f"✓✓✓ IMPROVED SETUP COMPLETE ✓✓✓")
print(f"Results: {output_file}\n")
print(json.dumps(result, indent=2, default=str))
