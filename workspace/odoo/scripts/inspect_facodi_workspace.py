"""Inspect FACODI workspace in Odoo - Step 1 of implementation."""
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
uid = c.authenticate()

print("=== INSPECTION STEP 1: Instance & Modules ===")
server_version = c.execute("ir.module.module", "search_read",
    [[("state", "=", "installed")]],
    {"fields": ["name"], "limit": 200}
)
print("Installed modules count:", len(server_version))
key_modules = [m["name"] for m in server_version if any(x in m["name"] for x in ["project", "web", "website", "sale", "slide", "task"])]
print("Relevant modules:", key_modules)

print("\n=== INSPECTION STEP 2: Existing FACODI Project ===")
facodi_proj = c.execute("project.project", "search_read",
    [[("name", "ilike", "FACODI")]],
    {"fields": ["id", "name", "active", "user_id", "privacy_visibility"], "limit": 10}
)
print("FACODI projects:", json.dumps(facodi_proj, indent=2, default=str))

print("\n=== INSPECTION STEP 3: Project Stages ===")
if facodi_proj:
    proj_id = facodi_proj[0]["id"]
    stages = c.execute("project.task.type", "search_read",
        [[("project_ids", "in", [proj_id])]],
        {"fields": ["id", "name", "sequence"], "order": "sequence ASC", "limit": 50}
    )
    print(f"Stages for project {proj_id}:", json.dumps(stages, indent=2, default=str))
else:
    all_stages = c.execute("project.task.type", "search_read",
        [[]],
        {"fields": ["id", "name", "sequence"], "order": "sequence ASC", "limit": 20}
    )
    print("All available stages:", json.dumps(all_stages, indent=2, default=str))

print("\n=== INSPECTION STEP 4: Existing Tasks in FACODI Project ===")
if facodi_proj:
    proj_id = facodi_proj[0]["id"]
    proj_tasks = c.execute("project.task", "search_read",
        [[("project_id", "=", proj_id)]],
        {"fields": ["id", "name", "stage_id", "user_id", "description"], "limit": 100}
    )
    print(f"Tasks in FACODI project ({len(proj_tasks)}):", json.dumps(proj_tasks[:5], indent=2, default=str))

print("\n=== INSPECTION STEP 5: Users (Marcelo & Bilal) ===")
users = c.execute("res.users", "search_read",
    [[("name", "in", ["Marcelo Santos", "Muhammad Bilal", "admin"])]],
    {"fields": ["id", "name", "email"], "limit": 10}
)
print("Team members found:", json.dumps(users, indent=2, default=str))

print("\n=== INSPECTION STEP 6: eLearning Structure ===")
channels = c.execute("slide.channel", "search_read",
    [[]],
    {"fields": ["id", "name", "slide_ids"], "limit": 10}
)
print("Channels count:", len(channels))
for ch in channels:
    slide_count = len(ch.get("slide_ids", []))
    print(f"  - {ch['name']} (slides: {slide_count})")
