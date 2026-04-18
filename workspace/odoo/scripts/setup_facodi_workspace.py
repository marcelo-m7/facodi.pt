"""Complete FACODI workspace setup and implementation."""
import os, sys, json
from datetime import datetime
os.environ.pop("SSLKEYLOGFILE", None)
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from odoo_test_utils import load_env, get_odoo_credentials, OdooClient

workspace_root = Path(__file__).resolve().parents[3]
project_root   = workspace_root.parent
load_env(workspace_root=workspace_root, project_root=project_root)
h, d, u, p = get_odoo_credentials()
c = OdooClient(h, d, u, p)
uid = c.authenticate()

log = []

def log_step(title, content=""):
    line = f"[{datetime.now().isoformat()}] {title}"
    if content:
        line += f"\n{content}"
    log.append(line)
    print(line)

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1: INSPECT
# ─────────────────────────────────────────────────────────────────────────────

log_step("STEP 1: INSPECTING EXISTING STRUCTURE")

# Check modules
modules_res = c.execute("ir.module.module", "search_read",
    [[("state", "=", "installed")]],
    {"fields": ["name"], "limit": 200}
)
key_modules = [m["name"] for m in modules_res if any(x in m["name"] for x in ["project", "task", "website", "slide"])]
log_step("Key modules installed", ", ".join(key_modules))

# Check existing FACODI project
facodi_projects = c.execute("project.project", "search_read",
    [[("name", "ilike", "FACODI")]],
    {"fields": ["id", "name", "active"], "limit": 10}
)
log_step(f"FACODI projects found: {len(facodi_projects)}")
if facodi_projects:
    for proj in facodi_projects:
        log_step(f"  → Project {proj['id']}: {proj['name']} (active={proj['active']})")

# Get/create FACODI project
if not facodi_projects:
    proj_id = c.execute("project.project", "create", [{
        "name": "FACODI — Digital Platform",
        "privacy_visibility": "employees",
    }])
    log_step(f"CREATED FACODI project ID: {proj_id}")
    facodi_projects = [{"id": proj_id, "name": "FACODI — Digital Platform"}]
else:
    proj_id = facodi_projects[0]["id"]
    log_step(f"USING existing FACODI project ID: {proj_id}")

# Check users
users = c.execute("res.users", "search_read",
    [[("name", "in", ["Marcelo Santos", "Muhammad Bilal"])]],
    {"fields": ["id", "name"], "limit": 5}
)
user_map = {u["name"]: u["id"] for u in users}
log_step(f"Users found: {json.dumps(user_map)}")

# Check stages
existing_stages = c.execute("project.task.type", "search_read",
    [[("project_ids", "in", [proj_id])]],
    {"fields": ["id", "name", "sequence"], "order": "sequence ASC", "limit": 50}
)
log_step(f"Existing stages in project: {len(existing_stages)}", json.dumps([(s['name'], s['sequence']) for s in existing_stages]))

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2: CREATE/NORMALIZE STAGES
# ─────────────────────────────────────────────────────────────────────────────

log_step("STEP 2: NORMALIZING STAGES")

required_stages = [
    ("Planning", 10),
    ("Definition", 20),
    ("Design / Structure", 30),
    ("Development", 40),
    ("Low-code / Content", 50),
    ("Validation", 60),
    ("Publication", 70),
    ("Iteration", 80),
]

# Delete existing stages to avoid duplicates (if any)
existing_stage_ids = [s["id"] for s in existing_stages]
if existing_stage_ids:
    # Instead of deleting, we'll just update/reorder them if they match
    log_step(f"Found {len(existing_stages)} existing stages, will update")

stage_map = {}
for idx, (stage_name, sequence) in enumerate(required_stages):
    # Check if stage exists
    found_stages = [s for s in existing_stages if s["name"] == stage_name]
    if found_stages:
        stage_id = found_stages[0]["id"]
        c.execute("project.task.type", "write", [[stage_id], {"sequence": sequence}])
        log_step(f"UPDATED stage '{stage_name}' (ID {stage_id})")
        stage_map[stage_name] = stage_id
    else:
        stage_id = c.execute("project.task.type", "create", [{
            "name": stage_name,
            "sequence": sequence,
            "project_ids": [[4, proj_id]],
        }])
        log_step(f"CREATED stage '{stage_name}' (ID {stage_id})")
        stage_map[stage_name] = stage_id

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3: CREATE INITIAL TASK GROUPS
# ─────────────────────────────────────────────────────────────────────────────

log_step("STEP 3: CREATING TASK GROUPS")

# Task groups structure
task_groups = {
    "Website Refactor": {
        "owner": user_map.get("Marcelo Santos", uid),
        "collaborator": "Bilal",
        "stage": "Planning",
        "subtasks": [
            "Audit current website structure and navigation",
            "Review information architecture (IA) and current sitemap",
            "Define new sitemap and primary navigation",
            "Design homepage structure and user journey",
            "Define relationship between website and Odoo eLearning",
            "Identify what should remain static vs dynamic",
            "Review CTA structure and conversion paths",
            "Review footer, trust, and partner areas",
            "Ensure consistency between brand, mission, and Educational offer",
        ]
    },
    "Course Selection and Expansion": {
        "owner": user_map.get("Marcelo Santos", uid),
        "collaborator": "Bilal",
        "stage": "Definition", 
        "subtasks": [
            "Audit courses already migrated into Odoo",
            "Identify next priority courses to migrate",
            "Define selection criteria for new courses",
            "Group courses by learning path or category",
            "Define MVP course set for public website",
            "Determine which courses are draft/internal vs public-ready",
            "Create planning placeholders for candidate courses",
        ]
    },
    "Page Planning": {
        "owner": user_map.get("Bilal", uid),
        "stage": "Design / Structure",
        "subtasks": [
            "Plan homepage: objective, audience, message, CTA, sections",
            "Plan 'About FACODI' page: mission, team, story",
            "Plan 'Courses / Learning Paths' page: discovery, filtering",
            "Plan 'Single Course Page' template: content structure",
            "Plan 'Lesson / Content' page template",
            "Plan 'Community' page: engagement, discussion",
            "Plan 'Roadmap' page: public transparency",
            "Plan 'Partners / Institutional Context' page",
            "Plan 'Contact' page: support and inquiries",
            "Plan 'FAQ / How It Works' page if justified",
        ]
    },
    "eLearning and Course Structure": {
        "owner": user_map.get("Marcelo Santos", uid),
        "collaborator": "Bilal",
        "stage": "Design / Structure",
        "subtasks": [
            "Review and normalize current eLearning structure in Odoo",
            "Define course taxonomy and categories",
            "Define course tags and metadata fields",
            "Define learning path structure and sequencing",
            "Define lesson/content ordering and dependencies",
            "Define public preview and enrollment strategy",
            "Define publication readiness criteria",
            "Audit and complete missing course metadata",
            "Ensure consistency between website pages and course records",
        ]
    },
    "Content and Copy": {
        "owner": user_map.get("Bilal", uid),
        "collaborator": "Marcelo",
        "stage": "Development",
        "subtasks": [
            "Define page-level copy requirements and messaging",
            "Define content ownership and contribution guidelines",
            "Draft copy backlog for all planned pages",
            "Review messaging consistency across website",
            "Complete missing course descriptions",
            "Add benefit-oriented copy to course listings",
            "Add institutional context and mission explanation",
            "Write CTA copy and call-to-action refinements",
        ]
    },
    "Technical and Odoo Configuration": {
        "owner": user_map.get("Marcelo Santos", uid),
        "stage": "Development",
        "subtasks": [
            "Review installed modules relevant to FACODI",
            "Verify project management setup and permissions",
            "Verify website module integration and capabilities",
            "Verify eLearning/slide module setup and features",
            "Configure ownership and permission logic",
            "Identify required automations and workflows",
            "Identify and create needed custom fields if any",
            "Document risks and technical blockers",
            "Plan scalable structure for content operations",
        ]
    },
    "Validation and Publishing Readiness": {
        "owner": user_map.get("Marcelo Santos", uid),
        "stage": "Validation",
        "subtasks": [
            "Validate completeness of all main pages",
            "Validate completeness of primary courses",
            "Test all links and internal consistency",
            "Review task assignments and ownership clarity",
            "Identify and merge duplicated work",
            "Prepare publication checklist",
            "Prepare post-launch iteration and improvement list",
            "Coordinate final stakeholder review",
        ]
    }
}

# Create parent tasks and subtasks
created_tasks = []
for group_name, group_config in task_groups.items():
    owner_id = group_config["owner"]
    stage_id = stage_map[group_config["stage"]]
    collab = group_config.get("collaborator", "")
    
    # Create parent task
    parent_description = f"""
Objective: {group_name}

Collaborator: {collab}

Subtasks:
{chr(10).join('- ' + s for s in group_config['subtasks'])}
""".strip()
    
    parent_id = c.execute("project.task", "create", [{
        "name": group_name,
        "project_id": proj_id,
        "stage_id": stage_id,
        "user_id": owner_id,
        "description": parent_description,
    }])
    log_step(f"CREATED task group '{group_name}' (ID {parent_id}, owner={owner_id})")
    created_tasks.append(parent_id)
    
    # Create subtasks (if supported - check if parent_id field exists)
    for idx, subtask_name in enumerate(group_config["subtasks"], 1):
        try:
            subtask_id = c.execute("project.task", "create", [{
                "name": f"{idx}. {subtask_name}",
                "project_id": proj_id,
                "stage_id": stage_id,
                "user_id": owner_id,
                "parent_id": parent_id,
            }])
            log_step(f"  → CREATED subtask (ID {subtask_id})")
        except Exception as e:
            log_step(f"  → Subtask creation skipped: {str(e)[:60]}")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4: VERIFY
# ─────────────────────────────────────────────────────────────────────────────

log_step("STEP 4: VERIFICATION")

all_tasks = c.execute("project.task", "search_read",
    [[("project_id", "=", proj_id)]],
    {"fields": ["id", "name", "stage_id", "user_id"], "limit": 200}
)
log_step(f"Total tasks created: {len(all_tasks)}")

stage_summary = {}
for task in all_tasks:
    stage_name = task["stage_id"][1] if task.get("stage_id") else "Unknown"
    stage_summary[stage_name] = stage_summary.get(stage_name, 0) + 1
log_step("Tasks by stage:", json.dumps(stage_summary))

# ─────────────────────────────────────────────────────────────────────────────
# SAVE LOG
# ─────────────────────────────────────────────────────────────────────────────

log_file = Path(__file__).parent / "facodi_setup_log.txt"
with open(log_file, "w", encoding="utf-8") as f:
    f.write("\n".join(log))

print(f"\n✓ SETUP COMPLETE. Log saved to: {log_file}")
