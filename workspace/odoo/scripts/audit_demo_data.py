"""Audit Odoo for demo / non-FACODI data. Read-only – no changes made."""
from __future__ import annotations
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # workspace/odoo
from odoo_test_utils import load_env, get_odoo_credentials, OdooClient

workspace_root = Path(__file__).resolve().parents[3]      # workspace/
project_root   = workspace_root.parent                    # facodi.pt/

load_env(workspace_root=workspace_root, project_root=project_root)
h, d, u, p = get_odoo_credentials()
c = OdooClient(h, d, u, p)
c.authenticate()

# ── slide.channel ────────────────────────────────────────────────────────────
channels = c.execute(
    "slide.channel", "search_read", [[]],
    {"fields": ["id", "name", "x_facodi_project_slug"], "limit": 500},
)

# ── slide.slide ───────────────────────────────────────────────────────────────
slides = c.execute(
    "slide.slide", "search_read", [[]],
    {"fields": ["id", "name", "channel_id", "x_facodi_project_slug"], "limit": 3000},
)

# ── ir.model.data – facodi module ────────────────────────────────────────────
facodi_xmlids = c.execute(
    "ir.model.data", "search_read",
    [[("module", "=", "facodi")]],
    {"fields": ["name", "model", "res_id"], "limit": 1000},
)

facodi_ch_ids = {x["res_id"] for x in facodi_xmlids if x["model"] == "slide.channel"}
facodi_sl_ids = {x["res_id"] for x in facodi_xmlids if x["model"] == "slide.slide"}

demo_channels = [ch for ch in channels if ch["id"] not in facodi_ch_ids]
demo_slides   = [s  for s  in slides   if s["id"] not in facodi_sl_ids]

report = {
    "summary": {
        "total_channels":        len(channels),
        "facodi_channels":       len(facodi_ch_ids),
        "non_facodi_channels":   len(demo_channels),
        "total_slides":          len(slides),
        "facodi_slides":         len(facodi_sl_ids),
        "non_facodi_slides":     len(demo_slides),
    },
    "facodi_channels":     [{"id": c["id"], "name": c["name"]} for c in channels if c["id"] in facodi_ch_ids],
    "non_facodi_channels": [{"id": c["id"], "name": c["name"]} for c in demo_channels],
    "non_facodi_slides_sample": [
        {"id": s["id"], "name": s["name"], "channel": s["channel_id"]}
        for s in demo_slides[:30]
    ],
}

print(json.dumps(report, ensure_ascii=False, indent=2))
