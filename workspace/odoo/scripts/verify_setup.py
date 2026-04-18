"""Verify FACODI workspace setup status in Odoo."""
import os, sys, json
os.environ.pop("SSLKEYLOGFILE", None)
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from odoo_test_utils import load_env, get_odoo_credentials, OdooClient

workspace_root = Path(__file__).resolve().parents[3]
project_root   = workspace_root.parent
load_env(workspace_root=workspace_root, project_root=project_root)
h, d, u, p = get_odoo_credentials()
c = OdooClient(h, d, u, p)
c.authenticate()

# Get FACODI project
proj = c.execute("project.project", "search_read",
    [[("name", "ilike", "FACODI")]],
    {"fields": ["id", "name", "active"]}
)

if proj:
    proj_id = proj[0]["id"]
    print(f"FACODI Project found: ID {proj_id}")
    
    # Get stages
    stages = c.execute("project.task.type", "search_read",
        [[("project_ids", "in", [proj_id])]],
        {"fields": ["id", "name", "sequence"], "order": "sequence ASC"}
    )
    print(f"Stages: {len(stages)}")
    for s in stages:
        print(f"  - {s['name']} (seq {s['sequence']})")
    
    # Get tasks
    tasks = c.execute("project.task", "search_read",
        [[("project_id", "=", proj_id)]],
        {"fields": ["id", "name", "stage_id", "parent_id"]}
    )
    print(f"\nTasks: {len(tasks)}")
    parent_tasks = [t for t in tasks if not t.get("parent_id")]
    child_tasks = [t for t in tasks if t.get("parent_id")]
    print(f"  - Parent tasks: {len(parent_tasks)}")
    print(f"  - Subtasks: {len(child_tasks)}")
    for pt in parent_tasks:
        print(f"    • {pt['name']}")
else:
    print("FACODI Project NOT found - setup may need to be run")

# Save to readable file
result = {
    "project_exists": bool(proj),
    "project_id": proj[0]["id"] if proj else None,
    "stages_count": len(stages) if proj else 0,
    "tasks_total": len(tasks) if proj else 0,
    "parent_tasks": len([t for t in tasks if not t.get("parent_id")]) if proj else 0,
    "stages_list": [(s['name'], s['sequence']) for s in stages] if proj else []
}

output_path = Path(__file__).parent / "verify_results.json"
with open(output_path, "w") as f:
    json.dump(result, f, indent=2, default=str)

print(f"\nResults saved to: {output_path}")
