#!/usr/bin/env python3
"""
Fast direct FACODI setup - executes API calls synchronously and saves JSON output.
Run with: python workspace/odoo/scripts/facodi_setup_final.py > output.log 2>&1
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
# SINGLE EXECUTION PATH - NO BRANCHING
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
print(f"   Marcelo: {marcelo_id}, Bilal: {bilal_id}\n")

# 3. Create stages
print("3. Create project stages...")
stages = [
    ("Planning", 10),
    ("Definition", 20),
    ("Design / Structure", 30),
    ("Development", 40),
    ("Low-code / Content", 50),
    ("Validation", 60),
    ("Publication", 70),
    ("Iteration", 80),
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

# 4. Create task groups - define at top level
task_groups_data = [
    ("A. Website Refactor", marcelo_id, "Planning", [
        "Audit current website structure and navigation",
        "Review information architecture and current sitemap",
        "Define new sitemap and primary navigation",
        "Design homepage structure and user journey",
        "Define relationship between website and Odoo eLearning",
        "Identify what should remain static vs dynamic",
        "Review CTA structure and conversion paths",
        "Review footer and trust/partner areas",
        "Ensure consistency between brand, mission, and educational offer",
    ]),
    ("B. Course Selection and Expansion", marcelo_id, "Definition", [
        "Audit courses already migrated into Odoo",
        "Identify next priority courses to migrate",
        "Define selection criteria for new courses",
        "Group courses by learning path or category",
        "Define MVP course set for public website",
        "Determine which courses are draft/internal vs public-ready",
        "Create planning placeholders for candidate courses",
    ]),
    ("C. Page Planning", bilal_id, "Design / Structure", [
        "Plan homepage: objective, audience, main message, CTA",
        "Plan 'About FACODI': mission, story, team",
        "Plan 'Courses / Learning Paths': discovery, filtering",
        "Plan 'Single Course Page' template and content structure",
        "Plan 'Lesson / Content' page template",
        "Plan 'Community' page: engagement and discussion",
        "Plan 'Roadmap' page: public transparency",
        "Plan 'Partners / Institutional Context' page",
        "Plan 'Contact' page: support and inquiries",
        "Plan 'FAQ / How It Works' page if justified",
    ]),
    ("D. eLearning and Course Structure", marcelo_id, "Design / Structure", [
        "Review and normalize current eLearning structure in Odoo",
        "Define course taxonomy and categories",
        "Define course tags and metadata fields",
        "Define learning path structure and sequencing",
        "Define lesson/content ordering and dependencies",
        "Define public preview and enrollment strategy",
        "Define publication readiness criteria for courses",
        "Audit and complete missing course metadata",
        "Ensure consistency between website pages and course records",
    ]),
    ("E. Content and Copy", bilal_id, "Development", [
        "Define page-level copy requirements and messaging",
        "Define content ownership and contribution guidelines",
        "Draft copy backlog for all planned pages",
        "Review messaging consistency across website",
        "Complete missing course descriptions",
        "Add benefit-oriented copy to course listings",
        "Add institutional context and mission explanation",
        "Write CTA copy and call-to-action refinements",
    ]),
    ("F. Technical and Odoo Configuration", marcelo_id, "Development", [
        "Review installed modules relevant to FACODI",
        "Verify project management setup and permissions",
        "Verify website module integration and capabilities",
        "Verify eLearning/slide module setup and features",
        "Configure ownership and permission logic",
        "Identify required automations and workflows",
        "Identify and create needed custom fields if any",
        "Document risks and technical blockers",
        "Plan scalable structure for content operations",
    ]),
    ("G. Validation and Publishing Readiness", marcelo_id, "Validation", [
        "Validate completeness of all main pages",
        "Validate completeness of primary courses",
        "Test all links and internal consistency",
        "Review task assignments and ownership clarity",
        "Identify and merge duplicated work",
        "Prepare publication checklist and sign-off",
        "Prepare post-launch iteration and improvement list",
        "Coordinate final stakeholder review",
    ]),
]

# 5. Create task groups with subtasks
print("4. Create task groups and subtasks...")
total_created = 0
task_groups_created = []

for group_name, owner_id, stage_name, subtasks in task_groups_data:
    stage_id = stage_ids[stage_name]
    
    # Create parent
    parent_id = client.execute("project.task", "create", [{
        "name": group_name,
        "project_id": proj_id,
        "stage_id": stage_id,
        "user_id": owner_id,
    }])
    total_created += 1
    print(f"   {group_name} [{parent_id}]")
    
    # Create subtasks
    for i, sub in enumerate(subtasks, 1):
        sub_id = client.execute("project.task", "create", [{
            "name": f"{i}. {sub}",
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
    "project_id": proj_id,
    "stage_count": len(stage_ids),
    "task_groups": task_groups_created,
    "total_tasks": total_created,
}

output_file = workspace_odoo_dir / "FACODI_SETUP_RESULT.json"
with open(output_file, "w") as f:
    json.dump(result, f, indent=2, default=str)

print(f"✓✓✓ SETUP COMPLETE ✓✓✓")
print(f"Results: {output_file}\n")
print(json.dumps(result, indent=2, default=str))
