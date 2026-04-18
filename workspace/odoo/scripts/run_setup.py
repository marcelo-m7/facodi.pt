#!/usr/bin/env python.exe
"""Execute FACODI setup and save detailed results."""
import os, sys, json, traceback
from pathlib import Path
from datetime import datetime

os.environ.pop("SSLKEYLOGFILE", None)

# Setup paths
workspace_odoo = Path(__file__).parent
workspace_root = workspace_odoo.parent
project_root = workspace_root.parent
sys.path.insert(0, str(workspace_odoo))

output_file = workspace_odoo / "facodi_setup_results.json"
log_lines = []

def log(msg):
    log_lines.append(f"[{datetime.now().isoformat()}] {msg}")
    print(msg)

try:
    log("========== FACODI WORKSPACE SETUP ==========")
    log(f"Python: {sys.executable}")
    log(f"Workspace: {workspace_root}")
    
    # Import client
    log("Importing OdooClient...")
    from odoo_test_utils import load_env, get_odoo_credentials, OdooClient
    
    # Initialize
    log("Loading credentials...")
    load_env(workspace_root=workspace_root, project_root=project_root)
    h, d, u, p = get_odoo_credentials()
    c = OdooClient(h, d, u, p)
    uid = c.authenticate()
    log(f"✓ Authenticated as UID {uid}")
    
    results = {
        "status": "running",
        "uid": uid,
        "project": None,
        "stages": [],
        "task_groups": [],
        "errors": []
    }
    
    # ─────────────────────────────────────────────────────────────────────
    # GET/CREATE PROJECT
    # ─────────────────────────────────────────────────────────────────────
    log("\n--- GET/CREATE PROJECT ---")
    facodi_projects = c.execute("project.project", "search_read",
        [[("name", "=", "FACODI — Digital Platform")]],
        {"fields": ["id", "name"]}
    )
    
    if facodi_projects:
        proj_id = facodi_projects[0]["id"]
        log(f"Found existing project: ID {proj_id}")
    else:
        proj_id = c.execute("project.project", "create", [{
            "name": "FACODI — Digital Platform",
            "privacy_visibility": "employees",
        }])
        log(f"Created new project: ID {proj_id}")
    
    results["project"] = {"id": proj_id, "name": "FACODI — Digital Platform"}
    
    # ─────────────────────────────────────────────────────────────────────
    # GET USERS
    # ─────────────────────────────────────────────────────────────────────
    log("\n--- GET USERS ---")
    all_users = c.execute("res.users", "search_read", [[("id", ">", 0)]], {"fields": ["id", "name"], "limit": 50})
    
    marcelo_id = None
    bilal_id = None
    for user in all_users:
        if "marcelo" in user["name"].lower():
            marcelo_id = user["id"]
            log(f"Found Marcelo: ID {marcelo_id}")
        if "bilal" in user["name"].lower() or "muhammad" in user["name"].lower():
            bilal_id = user["id"]
            log(f"Found Bilal: ID {bilal_id}")
    
    marcelo_id = marcelo_id or 2
    bilal_id = bilal_id or marcelo_id
    
    # ─────────────────────────────────────────────────────────────────────
    # CREATE STAGES
    # ─────────────────────────────────────────────────────────────────────
    log("\n--- CREATE STAGES ---")
    stages_def = [
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
    for stage_name, sequence in stages_def:
        existing = c.execute("project.task.type", "search_read",
            [[("name", "=", stage_name), ("project_ids", "in", [proj_id])]],
            {"fields": ["id"]}
        )
        if existing:
            stage_id = existing[0]["id"]
            log(f"Stage exists: {stage_name} (ID {stage_id})")
        else:
            stage_id = c.execute("project.task.type", "create", [{
                "name": stage_name,
                "sequence": sequence,
                "project_ids": [[4, proj_id]],
            }])
            log(f"Created stage: {stage_name} (ID {stage_id})")
        
        stage_map[stage_name] = stage_id
        results["stages"].append({"name": stage_name, "id": stage_id, "sequence": sequence})
    
    # ─────────────────────────────────────────────────────────────────────
    # CREATE TASK GROUPS
    # ─────────────────────────────────────────────────────────────────────
    log("\n--- CREATE TASK GROUPS ---")
    
    task_groups = [
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
    
    total_tasks = 0
    for group_name, owner_id, stage_name, subtasks in task_groups:
        stage_id = stage_map[stage_name]
        
        # Create parent task
        parent_id = c.execute("project.task", "create", [{
            "name": group_name,
            "project_id": proj_id,
            "stage_id": stage_id,
            "user_id": owner_id,
            "description": f"Task group for: {group_name}\n\nIncludes {len(subtasks)} subtasks",
        }])
        log(f"Created task: {group_name} (ID {parent_id})")
        total_tasks += 1
        
        # Create subtasks
        for idx, subtask in enumerate(subtasks, 1):
            subtask_id = c.execute("project.task", "create", [{
                "name": f"{idx}. {subtask}",
                "project_id": proj_id,
                "stage_id": stage_id,
                "user_id": owner_id,
                "parent_id": parent_id,
            }])
            total_tasks += 1
        
        results["task_groups"].append({
            "name": group_name,
            "parent_id": parent_id,
            "owner_id": owner_id,
            "stage": stage_name,
            "subtask_count": len(subtasks)
        })
    
    results["status"] = "success"
    results["total_tasks_created"] = total_tasks
    
    log(f"\n✓✓✓ SETUP COMPLETE ✓✓✓")
    log(f"Total tasks created: {total_tasks}")
    
except Exception as e:
    log(f"\n✗✗✗ ERROR ✗✗✗")
    log(f"{type(e).__name__}: {str(e)}")
    log(traceback.format_exc())
    results["status"] = "error"
    results["error"] = str(e)
    results["traceback"] = traceback.format_exc()

# Save results
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, default=str)

log(f"\nResults saved to: {output_file}")

# Also save log
log_file = workspace_odoo / "facodi_setup.log"
with open(log_file, "w", encoding="utf-8") as f:
    f.write("\n".join(log_lines))

log(f"Log saved to: {log_file}")
print("\n✓ Done!")
