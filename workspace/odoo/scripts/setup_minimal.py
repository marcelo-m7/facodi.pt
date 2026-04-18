#!/usr/bin/env python3
"""
Minimal FACODI setup - direct and synchronous.
Run with: python setup_minimal.py
"""
import os, sys, json
os.environ.pop("SSLKEYLOGFILE", None)
from pathlib import Path

# Setup path
workspace_dir = Path(__file__).parent
sys.path.insert(0, str(workspace_dir))

# Import
from odoo_test_utils import load_env, get_odoo_credentials, OdooClient

# Init
load_env(workspace_root=workspace_dir.parent, project_root=workspace_dir.parent.parent)
h, d, u, p = get_odoo_credentials()
c = OdooClient(h, d, u, p)
c.authenticate()
print("✓ Connected")

# Get/create project
proj = c.execute("project.project", "search_read", [[("name", "=", "FACODI — Digital Platform")]], {"fields": ["id"]})
proj_id = proj[0]["id"] if proj else c.execute("project.project", "create", [{"name": "FACODI — Digital Platform"}])
print(f"✓ Project ID: {proj_id}")

# Create stages
stage_map = {}
for name, seq in [("Planning", 10), ("Definition", 20), ("Design / Structure", 30), ("Development", 40), ("Low-code / Content", 50), ("Validation", 60), ("Publication", 70), ("Iteration", 80)]:
    existing = c.execute("project.task.type", "search_read", [[("name", "=", name), ("project_ids", "in", [proj_id])]], {"fields": ["id"]})
    sid = existing[0]["id"] if existing else c.execute("project.task.type", "create", [{"name": name, "sequence": seq, "project_ids": [[4, proj_id]]}])
    stage_map[name] = sid
print(f"✓ Stages: {len(stage_map)}")

# Get users
users = c.execute("res.users", "search_read", [[("id", ">", 0)]], {"fields": ["id", "name"], "limit": 100})
marcelo = next((u["id"] for u in users if "marcelo" in u["name"].lower()), 2)
bilal = next((u["id"] for u in users if "bilal" in u["name"].lower()), marcelo)
print(f"✓ Users: Marcelo={marcelo}, Bilal={bilal}")

# Tasks data
tasks = [
    ("A. Website Refactor", marcelo, "Planning", ["Audit current website structure and navigation", "Review information architecture and current sitemap", "Define new sitemap and primary navigation", "Design homepage structure and user journey", "Define relationship between website and Odoo eLearning", "Identify what should remain static vs dynamic", "Review CTA structure and conversion paths", "Review footer and trust/partner areas", "Ensure consistency between brand, mission, and educational offer"]),
    ("B. Course Selection and Expansion", marcelo, "Definition", ["Audit courses already migrated into Odoo", "Identify next priority courses to migrate", "Define selection criteria for new courses", "Group courses by learning path or category", "Define MVP course set for public website", "Determine which courses are draft/internal vs public-ready", "Create planning placeholders for candidate courses"]),
    ("C. Page Planning", bilal, "Design / Structure", ["Plan homepage: objective, audience, main message, CTA", "Plan 'About FACODI': mission, story, team", "Plan 'Courses / Learning Paths': discovery, filtering", "Plan 'Single Course Page' template and content structure", "Plan 'Lesson / Content' page template", "Plan 'Community' page: engagement and discussion", "Plan 'Roadmap' page: public transparency", "Plan 'Partners / Institutional Context' page", "Plan 'Contact' page: support and inquiries", "Plan 'FAQ / How It Works' page if justified"]),
    ("D. eLearning and Course Structure", marcelo, "Design / Structure", ["Review and normalize current eLearning structure in Odoo", "Define course taxonomy and categories", "Define course tags and metadata fields", "Define learning path structure and sequencing", "Define lesson/content ordering and dependencies", "Define public preview and enrollment strategy", "Define publication readiness criteria for courses", "Audit and complete missing course metadata", "Ensure consistency between website pages and course records"]),
    ("E. Content and Copy", bilal, "Development", ["Define page-level copy requirements and messaging", "Define content ownership and contribution guidelines", "Draft copy backlog for all planned pages", "Review messaging consistency across website", "Complete missing course descriptions", "Add benefit-oriented copy to course listings", "Add institutional context and mission explanation", "Write CTA copy and call-to-action refinements"]),
    ("F. Technical and Odoo Configuration", marcelo, "Development", ["Review installed modules relevant to FACODI", "Verify project management setup and permissions", "Verify website module integration and capabilities", "Verify eLearning/slide module setup and features", "Configure ownership and permission logic", "Identify required automations and workflows", "Identify and create needed custom fields if any", "Document risks and technical blockers", "Plan scalable structure for content operations"]),
    ("G. Validation and Publishing Readiness", marcelo, "Validation", ["Validate completeness of all main pages", "Validate completeness of primary courses", "Test all links and internal consistency", "Review task assignments and ownership clarity", "Identify and merge duplicated work", "Prepare publication checklist and sign-off", "Prepare post-launch iteration and improvement list", "Coordinate final stakeholder review"]),
]

# Create tasks
total = 0
for gname, owner, stage, subs in tasks:
    gid = c.execute("project.task", "create", [{"name": gname, "project_id": proj_id, "stage_id": stage_map[stage], "user_id": owner}])
    total += 1
    for i, sub in enumerate(subs, 1):
        c.execute("project.task", "create", [{"name": f"{i}. {sub}", "project_id": proj_id, "stage_id": stage_map[stage], "user_id": owner, "parent_id": gid}])
        total += 1
    print(f"✓ {gname}")

print(f"\n✓✓✓ SUCCESS ✓✓✓")
print(f"Created {total} total tasks")

# Save result
result = {"status": "success", "project_id": proj_id, "stages": len(stage_map), "total_tasks": total}
with open(Path(__file__).parent / "RESULT.json", "w") as f:
    json.dump(result, f, indent=2)
print(f"Result saved to RESULT.json")
