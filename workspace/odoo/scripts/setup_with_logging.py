#!/usr/bin/env python3
"""FACODI Direct Setup - Comprehensive with streaming output to file."""
import os, sys, json, time
from pathlib import Path
from datetime import datetime

os.environ.pop("SSLKEYLOGFILE", None)

# Determine paths
this_file = Path(__file__).resolve()
project_root = this_file.parent
workspace_root = project_root / "workspace"
workspace_odoo = workspace_root / "odoo"

sys.path.insert(0, str(workspace_odoo))

# Output file setup
output_file = workspace_odoo / "scripts" / "SETUP_LOG.txt"
results_json = workspace_odoo / "scripts" / "SETUP_RESULTS.json"

output_lines = []

def log_write(msg):
    """Write to both stdout and log file."""
    timestamp = datetime.now().isoformat()
    line = f"[{timestamp}] {msg}"
    output_lines.append(line)
    print(line)
    # Write incrementally so we see progress
    with open(output_file, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def save_results(data):
    """Save results JSON."""
    with open(results_json, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    log_write(f"Results saved to: {results_json}")

try:
    # Clear old log
    if output_file.exists():
        output_file.unlink()
    
    log_write("=" * 80)
    log_write("FACODI WORKSPACE SETUP")
    log_write("=" * 80)
    log_write(f"Project root: {project_root}")
    log_write(f"Python: {sys.executable}")
    log_write("")
    
    # Import client
    log_write("Importing Odoo client...")
    from odoo_test_utils import load_env, get_odoo_credentials, OdooClient
    
    # Load credentials
    log_write("Loading credentials...")
    load_env(workspace_root=workspace_root, project_root=project_root)
    host, db, user, passwd = get_odoo_credentials()
    
    # Connect
    log_write(f"Connecting to Odoo: {host}/{db}")
    client = OdooClient(host, db, user, passwd)
    uid = client.authenticate()
    log_write(f"✓ Authenticated as UID {uid}")
    log_write("")
    
    # Initialize results
    results = {
        "status": "in_progress",
        "timestamp": datetime.now().isoformat(),
        "uid": uid,
        "host": host,
        "db": db,
        "project_id": None,
        "stages": [],
        "task_groups": [],
        "total_tasks": 0
    }
    
    # ─────────────────────────────────────────────────────────────────────
    # CREATE PROJECT
    # ─────────────────────────────────────────────────────────────────────
    log_write("Creating/verifying FACODI project...")
    proj_name = "FACODI — Digital Platform"
    
    existing_projs = client.execute("project.project", "search_read",
        [[("name", "=", proj_name)]],
        {"fields": ["id", "name"]}
    )
    
    if existing_projs:
        proj_id = existing_projs[0]["id"]
        log_write(f"  ✓ Found existing project (ID {proj_id})")
    else:
        proj_id = client.execute("project.project", "create", [{
            "name": proj_name,
            "privacy_visibility": "employees",
        }])
        log_write(f"  ✓ Created new project (ID {proj_id})")
    
    results["project_id"] = proj_id
    log_write("")
    
    # ─────────────────────────────────────────────────────────────────────
    # GET USERS
    # ─────────────────────────────────────────────────────────────────────
    log_write("Looking up team members...")
    users_all = client.execute("res.users", "search_read",
        [[("id", ">", 0)]],
        {"fields": ["id", "name"], "limit": 150}
    )
    
    marcelo_id = None
    bilal_id = None
    for u in users_all:
        if "marcelo" in u["name"].lower():
            marcelo_id = u["id"]
        elif "bilal" in u["name"].lower() or "muhammad" in u["name"].lower():
            bilal_id = u["id"]
    
    # Fallback
    if not marcelo_id:
        marcelo_id = 2
    if not bilal_id:
        bilal_id = marcelo_id
    
    log_write(f"  Marcelo: UID {marcelo_id}")
    log_write(f"  Bilal: UID {bilal_id}")
    log_write("")
    
    # ─────────────────────────────────────────────────────────────────────
    # CREATE STAGES
    # ─────────────────────────────────────────────────────────────────────
    log_write("Creating project stages...")
    stages_definition = [
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
    for stage_name, seq in stages_definition:
        existing_stage = client.execute("project.task.type", "search_read",
            [[("name", "=", stage_name), ("project_ids", "in", [proj_id])]],
            {"fields": ["id"]}
        )
        
        if existing_stage:
            sid = existing_stage[0]["id"]
            log_write(f"  ✓ '{stage_name}' exists (ID {sid})")
        else:
            sid = client.execute("project.task.type", "create", [{
                "name": stage_name,
                "sequence": seq,
                "project_ids": [[4, proj_id]],
            }])
            log_write(f"  ✓ Created '{stage_name}' (ID {sid})")
        
        stage_ids[stage_name] = sid
        results["stages"].append({
            "name": stage_name,
            "id": sid,
            "sequence": seq
        })
    
    log_write("")
    
    # ─────────────────────────────────────────────────────────────────────
    # DEFINE TASK GROUPS
    # ─────────────────────────────────────────────────────────────────────
    task_groups_definition = [
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
    
    # ─────────────────────────────────────────────────────────────────────
    # CREATE TASKS
    # ─────────────────────────────────────────────────────────────────────
    log_write("Creating task groups and subtasks...")
    total = 0
    
    for group_name, owner_id, stage_name, subtasks in task_groups_definition:
        stage_id = stage_ids[stage_name]
        
        # Create parent task
        parent_id = client.execute("project.task", "create", [{
            "name": group_name,
            "project_id": proj_id,
            "stage_id": stage_id,
            "user_id": owner_id,
        }])
        total += 1
        log_write(f"  ✓ {group_name} (ID {parent_id})")
        
        # Create subtasks
        for i, subtask_name in enumerate(subtasks, 1):
            sub_id = client.execute("project.task", "create", [{
                "name": f"{i}. {subtask_name}",
                "project_id": proj_id,
                "stage_id": stage_id,
                "user_id": owner_id,
                "parent_id": parent_id,
            }])
            total += 1
        
        log_write(f"    └─ {len(subtasks)} subtasks created")
        
        results["task_groups"].append({
            "name": group_name,
            "id": parent_id,
            "owner_id": owner_id,
            "stage": stage_name,
            "subtask_count": len(subtasks)
        })
    
    results["total_tasks"] = total
    log_write("")
    log_write(f"Total tasks created: {total}")
    log_write("")
    
    # ─────────────────────────────────────────────────────────────────────
    # SAVE RESULTS
    # ─────────────────────────────────────────────────────────────────────
    results["status"] = "success"
    save_results(results)
    
    log_write("=" * 80)
    log_write("✓✓✓ SETUP COMPLETE ✓✓✓")
    log_write("=" * 80)
    
except Exception as e:
    import traceback
    log_write("")
    log_write("=" * 80)
    log_write("✗✗✗ ERROR ✗✗✗")
    log_write("=" * 80)
    log_write(f"{type(e).__name__}: {str(e)}")
    log_write("")
    log_write(traceback.format_exc())
    
    results["status"] = "error"
    results["error"] = str(e)
    save_results(results)
