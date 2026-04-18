#!/usr/bin/env python3
"""Streamlined FACODI workspace setup - direct implementation."""
import os, sys, json
from datetime import datetime
os.environ.pop("SSLKEYLOGFILE", None)
from pathlib import Path

# Add workspace to path
workspace_odoo = Path(__file__).parent
workspace_root = workspace_odoo.parent
project_root = workspace_root.parent
sys.path.insert(0, str(workspace_odoo))

from odoo_test_utils import load_env, get_odoo_credentials, OdooClient

# Initialize
load_env(workspace_root=workspace_root, project_root=project_root)
h, d, u, p = get_odoo_credentials()
c = OdooClient(h, d, u, p)
uid = c.authenticate()
print(f"✓ Authenticated as UID {uid}")

# ─────────────────────────────────────────────────────────────────────────────
# GET OR CREATE FACODI PROJECT
# ─────────────────────────────────────────────────────────────────────────────

facodi_projects = c.execute("project.project", "search_read",
    [[("name", "=", "FACODI — Digital Platform")]],
    {"fields": ["id", "name"]}
)

if facodi_projects:
    proj_id = facodi_projects[0]["id"]
    print(f"✓ Found existing FACODI project: ID {proj_id}")
else:
    proj_id = c.execute("project.project", "create", [{
        "name": "FACODI — Digital Platform",
        "privacy_visibility": "employees",
    }])
    print(f"✓ Created FACODI project: ID {proj_id}")

# ─────────────────────────────────────────────────────────────────────────────
# GET USERS
# ─────────────────────────────────────────────────────────────────────────────

all_users = c.execute("res.users", "search_read",
    [[("id", ">", 0)]],
    {"fields": ["id", "name"]}
)

marcelo_id = None
bilal_id = None
for user in all_users:
    if "marcelo" in user["name"].lower():
        marcelo_id = user["id"]
    if "bilal" in user["name"].lower() or "muhammad" in user["name"].lower():
        bilal_id = user["id"]

marcelo_id = marcelo_id or 2  # fallback
bilal_id = bilal_id or marcelo_id  # fallback to marcelo if bilal not found

print(f"✓ Owner IDs: Marcelo={marcelo_id}, Bilal={bilal_id}")

# ─────────────────────────────────────────────────────────────────────────────
# CREATE STAGES
# ─────────────────────────────────────────────────────────────────────────────

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

stage_map = {}
for stage_name, sequence in stages:
    existing = c.execute("project.task.type", "search_read",
        [[("name", "=", stage_name), ("project_ids", "in", [proj_id])]],
        {"fields": ["id"]}
    )
    if existing:
        stage_id = existing[0]["id"]
    else:
        stage_id = c.execute("project.task.type", "create", [{
            "name": stage_name,
            "sequence": sequence,
            "project_ids": [[4, proj_id]],
        }])
    stage_map[stage_name] = stage_id
    print(f"✓ Stage '{stage_name}': ID {stage_id}")

# ─────────────────────────────────────────────────────────────────────────────
# CREATE TASK GROUPS
# ─────────────────────────────────────────────────────────────────────────────

task_groups = [
    {
        "name": "A. Website Refactor",
        "owner": marcelo_id,
        "stage": "Planning",
        "subtasks": [
            "Audit current website structure and navigation",
            "Review information architecture and current sitemap",
            "Define new sitemap and primary navigation",
            "Design homepage structure and user journey",
            "Define relationship between website and Odoo eLearning",
            "Identify what should remain static vs dynamic",
            "Review CTA structure and conversion paths",
            "Review footer and trust/partner areas",
            "Ensure consistency between brand, mission, and educational offer",
        ]
    },
    {
        "name": "B. Course Selection and Expansion",
        "owner": marcelo_id,
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
    {
        "name": "C. Page Planning",
        "owner": bilal_id,
        "stage": "Design / Structure",
        "subtasks": [
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
        ]
    },
    {
        "name": "D. eLearning and Course Structure",
        "owner": marcelo_id,
        "stage": "Design / Structure",
        "subtasks": [
            "Review and normalize current eLearning structure in Odoo",
            "Define course taxonomy and categories",
            "Define course tags and metadata fields",
            "Define learning path structure and sequencing",
            "Define lesson/content ordering and dependencies",
            "Define public preview and enrollment strategy",
            "Define publication readiness criteria for courses",
            "Audit and complete missing course metadata",
            "Ensure consistency between website pages and course records",
        ]
    },
    {
        "name": "E. Content and Copy",
        "owner": bilal_id,
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
    {
        "name": "F. Technical and Odoo Configuration",
        "owner": marcelo_id,
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
    {
        "name": "G. Validation and Publishing Readiness",
        "owner": marcelo_id,
        "stage": "Validation",
        "subtasks": [
            "Validate completeness of all main pages",
            "Validate completeness of primary courses",
            "Test all links and internal consistency",
            "Review task assignments and ownership clarity",
            "Identify and merge duplicated work",
            "Prepare publication checklist and sign-off",
            "Prepare post-launch iteration and improvement list",
            "Coordinate final stakeholder review",
        ]
    }
]

created_count = 0
for group in task_groups:
    group_name = group["name"]
    owner_id = group["owner"]
    stage_id = stage_map[group["stage"]]
    
    # Create parent task
    parent_id = c.execute("project.task", "create", [{
        "name": group_name,
        "project_id": proj_id,
        "stage_id": stage_id,
        "user_id": owner_id,
        "description": f"Task group: {group_name}\n\nStatus: Planning phase\nOwner: {owner_id}",
    }])
    created_count += 1
    print(f"✓ Created task: {group_name} (ID {parent_id})")
    
    # Create subtasks
    for idx, subtask in enumerate(group["subtasks"], 1):
        subtask_id = c.execute("project.task", "create", [{
            "name": f"{idx}. {subtask}",
            "project_id": proj_id,
            "stage_id": stage_id,
            "user_id": owner_id,
            "parent_id": parent_id,
        }])
        created_count += 1

print(f"\n✓✓✓ SETUP COMPLETE ✓✓✓")
print(f"Created {created_count} tasks total")
print(f"Project: FACODI — Digital Platform (ID {proj_id})")
print(f"Stages: {len(stage_map)} created")
print(f"Task groups: {len(task_groups)} created with subtasks")
